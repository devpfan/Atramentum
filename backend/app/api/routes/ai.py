from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

from app.db.database import get_db
from app.services.rag_assembler import assemble_context
from app.services.llm_client import generate_scene_text, edit_selected_text
from app.schemas.ai import GenerateSceneRequest, EditInlineRequest
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
