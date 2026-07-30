from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.manuscript import Book, Act, Chapter, Scene
from app.models.user import User
from app.schemas.manuscript import ManuscriptTree, Chapter as ChapterSchema, Scene as SceneSchema, ChapterCreate, SceneCreate
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.api.deps import get_current_user

router = APIRouter()

class BookBase(BaseModel):
    title: str
    synopsis: Optional[str] = None

class BookSchema(BookBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/books", response_model=List[BookSchema])
def get_books(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    books = db.query(Book).filter(Book.user_id == current_user.id).order_by(Book.created_at.desc()).all()
    if not books:
        # Create default book if none exists
        book = Book(title="Proyecto Sin Título", user_id=current_user.id)
        db.add(book)
        db.commit()
        db.refresh(book)
        
        act = Act(title="Acto 1", book_id=book.id, user_id=current_user.id)
        db.add(act)
        db.commit()
        db.refresh(act)
        
        chapter = Chapter(title="Capítulo 1", act_id=act.id, user_id=current_user.id)
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
        
        scene = Scene(
            title="Escena 1", 
            chapter_id=chapter.id, 
            user_id=current_user.id,
            content="<p>Érase una vez...</p>"
        )
        db.add(scene)
        db.commit()
        
        books = [book]
    return books

@router.post("/books", response_model=BookSchema)
def create_book(book_in: BookBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = Book(title=book_in.title, synopsis=book_in.synopsis, user_id=current_user.id)
    db.add(book)
    db.commit()
    db.refresh(book)
    
    act = Act(title="Acto 1", book_id=book.id, user_id=current_user.id)
    db.add(act)
    db.commit()
    db.refresh(act)
    
    chapter = Chapter(title="Capítulo 1", act_id=act.id, user_id=current_user.id)
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    
    scene = Scene(
        title="Escena 1", 
        chapter_id=chapter.id, 
        user_id=current_user.id,
        content="<p>Érase una vez...</p>"
    )
    db.add(scene)
    db.commit()
    
    return book

@router.get("/tree", response_model=ManuscriptTree)
def get_manuscript_tree(book_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Devuelve la estructura completa de Capítulos y Escenas.
    Si el usuario no tiene ningún libro, inicializa uno por defecto.
    """
    if book_id:
        book = db.query(Book).filter(Book.id == book_id, Book.user_id == current_user.id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Libro no encontrado")
    else:
        book = db.query(Book).filter(Book.user_id == current_user.id).order_by(Book.created_at.desc()).first()
    
    if not book:
        # Inicialización por defecto
        book = Book(title="Proyecto Sin Título", user_id=current_user.id)
        db.add(book)
        db.commit()
        db.refresh(book)
        
        act = Act(title="Acto 1", book_id=book.id, user_id=current_user.id)
        db.add(act)
        db.commit()
        db.refresh(act)
        
        chapter = Chapter(title="Capítulo 1", act_id=act.id, user_id=current_user.id)
        db.add(chapter)
        db.commit()
        db.refresh(chapter)
        
        scene = Scene(
            title="Escena 1", 
            chapter_id=chapter.id, 
            user_id=current_user.id,
            content="<p>Érase una vez...</p>"
        )
        db.add(scene)
        db.commit()
        db.refresh(scene)
    
    # Para el UI actual, aplanamos los Capítulos de todos los Actos de este Libro.
    acts = db.query(Act).filter(Act.book_id == book.id).all()
    act_ids = [a.id for a in acts]
    
    chapters = db.query(Chapter).filter(Chapter.act_id.in_(act_ids)).order_by(Chapter.order, Chapter.id).all()
    
    return ManuscriptTree(
        book_id=book.id,
        title=book.title,
        chapters=chapters
    )

@router.post("/chapters", response_model=ChapterSchema)
def create_chapter(chapter: ChapterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_chapter = Chapter(**chapter.model_dump(), user_id=current_user.id)
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)
    return db_chapter

@router.post("/scenes", response_model=SceneSchema)
def create_scene(scene: SceneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_scene = Scene(**scene.model_dump(), user_id=current_user.id)
    db.add(db_scene)
    db.commit()
    db.refresh(db_scene)
    return db_scene
