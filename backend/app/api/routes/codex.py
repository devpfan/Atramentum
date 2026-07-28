from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.codex import CodexEntry, CodexAlias
from app.schemas.codex import CodexEntry as CodexEntrySchema, CodexEntryCreate, CodexEntryUpdate

router = APIRouter()

@router.post("/", response_model=CodexEntrySchema)
def create_codex_entry(entry: CodexEntryCreate, db: Session = Depends(get_db)):
    db_entry = CodexEntry(
        name=entry.name,
        category=entry.category,
        description=entry.description,
        attributes=entry.attributes
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    if entry.aliases:
        for alias_str in entry.aliases:
            db_alias = CodexAlias(alias_name=alias_str, entry_id=db_entry.id)
            db.add(db_alias)
        db.commit()
        db.refresh(db_entry)

    return db_entry

@router.get("/", response_model=List[CodexEntrySchema])
def read_codex_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    entries = db.query(CodexEntry).offset(skip).limit(limit).all()
    return entries

@router.get("/{entry_id}", response_model=CodexEntrySchema)
def read_codex_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(CodexEntry).filter(CodexEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Ficha del Codex no encontrada")
    return entry
