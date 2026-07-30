from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

from app.db.database import get_db
from app.services.rag_assembler import assemble_context
from app.services.llm_client import generate_scene_text, edit_selected_text
from app.schemas.ai import GenerateSceneRequest, EditInlineRequest, ChatRequest
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/generate-scene")
def generate_scene(request: GenerateSceneRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        context = assemble_context(request.scene_id, current_user.id, db)
        return StreamingResponse(
            generate_scene_text(context, request.prompt), 
            media_type="text/event-stream"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/inline-edit")
def inline_edit(request: EditInlineRequest, current_user: User = Depends(get_current_user)):
    return StreamingResponse(
        edit_selected_text(request.selected_text, request.instruction),
        media_type="text/event-stream"
    )

@router.get("/chat/{scene_id}")
def get_chat_history(scene_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.chat import ChatSession
    real_scene_id = scene_id if scene_id > 0 else None
    session = db.query(ChatSession).filter(ChatSession.scene_id == real_scene_id, ChatSession.user_id == current_user.id).first()
    if not session:
        return []
    return session.messages

@router.delete("/chat/{scene_id}")
def clear_chat_history(scene_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.chat import ChatSession
    real_scene_id = scene_id if scene_id > 0 else None
    session = db.query(ChatSession).filter(ChatSession.scene_id == real_scene_id, ChatSession.user_id == current_user.id).first()
    if session:
        db.delete(session)
        db.commit()
    return {"ok": True}

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.services.llm_client import chat_with_assistant
    from app.models.chat import ChatSession, ChatMessage
    
    real_scene_id = request.scene_id if request.scene_id and request.scene_id > 0 else None
    context = ""
    try:
        context = assemble_context(real_scene_id, current_user.id, db)
    except ValueError:
        pass
            
    # Manejo de Sesión en BD
    chat_session = db.query(ChatSession).filter(
        ChatSession.scene_id == real_scene_id, 
        ChatSession.user_id == current_user.id
    ).first()
    
    if not chat_session:
        chat_session = ChatSession(user_id=current_user.id, scene_id=real_scene_id)
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
        
    # Guardar el mensaje del usuario (es el último del array request.messages)
    user_msg_content = request.messages[-1].content
    user_msg_db = ChatMessage(session_id=chat_session.id, role="user", content=user_msg_content)
    db.add(user_msg_db)
    db.commit()
    
    # Recuperar solo los últimos 10 mensajes para enviar a Gemini y ahorrar tokens
    recent_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == chat_session.id
    ).order_by(ChatMessage.id.desc()).limit(10).all()
    
    # Invertir para que queden en orden cronológico correcto
    recent_messages = list(reversed(recent_messages))
    
    async def chat_generator():
        full_response = ""
        async for chunk in chat_with_assistant(context, recent_messages):
            full_response += chunk
            yield chunk
            
        # Al finalizar el stream, guardamos en BD
        model_msg_db = ChatMessage(session_id=chat_session.id, role="model", content=full_response)
        db.add(model_msg_db)
        db.commit()

    return StreamingResponse(
        chat_generator(),
        media_type="text/event-stream"
    )
