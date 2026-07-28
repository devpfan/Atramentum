from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any

from app.db.database import get_db
from app.services.alias_scanner import scan_text_for_aliases

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    entities: List[Dict[str, Any]]

@router.post("/scan-aliases", response_model=AnalyzeResponse)
def scan_aliases(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analiza un bloque de texto libre y devuelve las entidades del Codex encontradas en él.
    Útil para la característica de "Auto-etiquetado" o "Highlight" del editor web.
    """
    detected = scan_text_for_aliases(request.text, db)
    return AnalyzeResponse(entities=detected)
