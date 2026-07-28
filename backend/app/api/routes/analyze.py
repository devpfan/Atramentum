from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.database import get_db
from app.services.alias_scanner import scan_text_for_aliases
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

class AliasMatch(BaseModel):
    matched_text: str
    codex_entry_id: int
    entry_name: str
    category: str

@router.post("/scan", response_model=List[AliasMatch])
def scan_text(request: AnalyzeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    matches = scan_text_for_aliases(request.text, current_user.id, db)
    return matches
