from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.manuscript import Series, Book
from app.models.user import User
from app.schemas.series import Series as SeriesSchema, SeriesCreate, SeriesUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[SeriesSchema])
def get_series(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    series = db.query(Series).filter(Series.user_id == current_user.id).order_by(Series.created_at.desc()).all()
    return series

@router.post("/", response_model=SeriesSchema)
def create_series(series_in: SeriesCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    series = Series(
        title=series_in.title,
        description=series_in.description,
        user_id=current_user.id
    )
    db.add(series)
    db.commit()
    db.refresh(series)
    return series

@router.put("/{series_id}", response_model=SeriesSchema)
def update_series(series_id: int, series_update: SeriesUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    series = db.query(Series).filter(Series.id == series_id, Series.user_id == current_user.id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
        
    if series_update.title is not None:
        series.title = series_update.title
    if series_update.description is not None:
        series.description = series_update.description
        
    db.commit()
    db.refresh(series)
    return series

@router.delete("/{series_id}")
def delete_series(series_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    series = db.query(Series).filter(Series.id == series_id, Series.user_id == current_user.id).first()
    if not series:
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    
    # Desvincular libros que pertenecen a la serie antes de eliminar
    db.query(Book).filter(Book.series_id == series_id).update({Book.series_id: None})
    
    db.delete(series)
    db.commit()
    return {"message": "Serie eliminada con éxito"}
