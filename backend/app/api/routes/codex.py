from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.codex import CodexEntry, CodexAlias
from app.models.user import User
from app.schemas.codex import CodexEntry as CodexEntrySchema, CodexEntryCreate, CodexEntryUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=CodexEntrySchema)
def create_entry(entry: CodexEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_entry = CodexEntry(
        user_id=current_user.id,
        name=entry.name,
        category=entry.category,
        description=entry.description,
        attributes=entry.attributes,
        book_id=entry.book_id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    # Añadir alias principales si existen
    if entry.aliases:
        for alias_name in entry.aliases:
            db_alias = CodexAlias(alias_name=alias_name, entry_id=db_entry.id)
            db.add(db_alias)
        db.commit()

    return db_entry

@router.get("/", response_model=List[CodexEntrySchema])
def read_entries(book_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = db.query(CodexEntry).filter(CodexEntry.user_id == current_user.id, CodexEntry.book_id == book_id).offset(skip).limit(limit).all()
    return entries

@router.get("/{entry_id}", response_model=CodexEntrySchema)
def read_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entry = db.query(CodexEntry).filter(CodexEntry.id == entry_id, CodexEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    return entry

@router.put("/{entry_id}", response_model=CodexEntrySchema)
def update_entry(entry_id: int, entry_update: CodexEntryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_entry = db.query(CodexEntry).filter(CodexEntry.id == entry_id, CodexEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")

    update_data = entry_update.model_dump(exclude_unset=True)
    
    if "aliases" in update_data:
        # Simplificación: Borramos y recreamos los alias.
        db.query(CodexAlias).filter(CodexAlias.entry_id == db_entry.id).delete()
        for alias_name in update_data["aliases"]:
            db_alias = CodexAlias(alias_name=alias_name, entry_id=db_entry.id)
            db.add(db_alias)
        del update_data["aliases"]

    for key, value in update_data.items():
        setattr(db_entry, key, value)
        if key == "attributes":
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(db_entry, "attributes")

    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_entry = db.query(CodexEntry).filter(CodexEntry.id == entry_id, CodexEntry.user_id == current_user.id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    
    db.delete(db_entry)
    db.commit()
    return {"ok": True}
