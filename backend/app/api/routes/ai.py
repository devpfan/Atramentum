from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.services.rag_assembler import assemble_context
from app.services.llm_client import generate_stream
from app.core.config import settings

router = APIRouter()

class GenerateRequest(BaseModel):
    scene_id: int
    prompt: str

class InlineEditRequest(BaseModel):
    selected_text: str
    action: str # ej. "rewrite", "expand", "shorten"

@router.post("/generate")
async def generate_text(request: GenerateRequest, db: Session = Depends(get_db)):
    """
    Genera texto nuevo para una escena basado en su contexto (RAG) de forma fluida (streaming).
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no está configurada en .env")
        
    system_prompt = assemble_context(request.scene_id, db)
    
    return StreamingResponse(
        generate_stream(system_prompt, request.prompt), 
        media_type="text/event-stream"
    )

@router.post("/inline-edit")
async def inline_edit(request: InlineEditRequest):
    """
    Acciones rápidas sobre un texto seleccionado (Reescribir, Expandir, etc).
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY no está configurada en .env")
        
    system_prompt = "Eres un asistente de edición. Modifica el texto según la acción solicitada. Retorna ÚNICAMENTE el texto editado sin comillas, saludos, ni explicaciones extra."
    user_prompt = f"Acción solicitada: {request.action}\n\nTexto original:\n{request.selected_text}"
    
    return StreamingResponse(
        generate_stream(system_prompt, user_prompt), 
        media_type="text/event-stream"
    )
