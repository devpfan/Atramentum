from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.codex import CodexEntry, CodexAlias
from app.models.manuscript import Book, Act, Chapter, Scene
from app.models.user import User
from app.schemas.codex import CodexEntry as CodexEntrySchema, CodexEntryCreate, CodexEntryUpdate
from app.api.deps import get_current_user
from app.services.llm_client import extract_characters
from bs4 import BeautifulSoup
from pydantic import BaseModel

router = APIRouter()

@router.post("/", response_model=CodexEntrySchema)
def create_entry(entry: CodexEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_entry = CodexEntry(
        user_id=current_user.id,
        name=entry.name,
        category=entry.category,
        description=entry.description,
        attributes=entry.attributes,
        book_id=entry.book_id,
        series_id=entry.series_id
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
    from sqlalchemy import or_
    
    # Obtener el libro para saber su series_id
    book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    if book.series_id:
        entries = db.query(CodexEntry).filter(
            CodexEntry.user_id == current_user.id,
            or_(CodexEntry.book_id == book_id, CodexEntry.series_id == book.series_id)
        ).offset(skip).limit(limit).all()
    else:
        entries = db.query(CodexEntry).filter(
            CodexEntry.user_id == current_user.id,
            CodexEntry.book_id == book_id
        ).offset(skip).limit(limit).all()
        
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

class ScanRequest(BaseModel):
    book_id: int

@router.post("/scan")
async def scan_document(request: ScanRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = db.query(Book).filter(Book.id == request.book_id, Book.user_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
        
    acts = db.query(Act).filter(Act.book_id == book.id).all()
    act_ids = [a.id for a in acts]
    chapters = db.query(Chapter).filter(Chapter.act_id.in_(act_ids)).order_by(Chapter.order, Chapter.id).all()
    chapter_ids = [c.id for c in chapters]
    scenes = db.query(Scene).filter(Scene.chapter_id.in_(chapter_ids)).order_by(Scene.order, Scene.id).all()
    
    # Extract text from HTML content
    full_text = ""
    for sc in scenes:
        if sc.content:
            soup = BeautifulSoup(sc.content, 'html.parser')
            full_text += soup.get_text(separator=' ') + "\n\n"
            
        # Limit to roughly 50,000 characters to keep it fast and avoid token limits
        if len(full_text) > 50000:
            full_text = full_text[:50000]
            break
            
    if not full_text.strip():
        raise HTTPException(status_code=400, detail="El documento no tiene contenido para escanear")
        
    # Llama al LLM
    try:
        # Pasa un ai_settings vacío para que use los valores por defecto (ej. gemini configurado en env)
        characters = await extract_characters(full_text, {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Obtener nombres existentes para evitar duplicados
    existing_entries = db.query(CodexEntry).filter(
        CodexEntry.user_id == current_user.id,
        CodexEntry.book_id == book.id,
        CodexEntry.category == "Character"
    ).all()
    existing_names = {e.name.lower() for e in existing_entries}
    
    inserted_count = 0
    for char in characters:
        name = char.get("name")
        if not name or name.lower() in existing_names:
            continue
            
        description = char.get("description", "")
        aliases = char.get("aliases", [])
        
        db_entry = CodexEntry(
            user_id=current_user.id,
            name=name,
            category="Character",
            description=description,
            attributes={},
            book_id=book.id,
            series_id=book.series_id
        )
        db.add(db_entry)
        db.flush() # To get ID for aliases
        
        for alias in aliases:
            if alias.strip() and alias.strip().lower() != name.lower():
                db_alias = CodexAlias(alias_name=alias.strip(), entry_id=db_entry.id)
                db.add(db_alias)
                
        existing_names.add(name.lower())
        inserted_count += 1
        
    db.commit()
    return {"inserted": inserted_count}
