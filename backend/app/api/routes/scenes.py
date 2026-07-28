from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.manuscript import Scene
from app.models.user import User
from app.schemas.manuscript import Scene as SceneSchema, SceneCreate, SceneUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=SceneSchema)
def create_scene(scene: SceneCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_scene = Scene(**scene.model_dump(), user_id=current_user.id)
    db.add(db_scene)
    db.commit()
    db.refresh(db_scene)
    return db_scene

@router.get("/{scene_id}", response_model=SceneSchema)
def read_scene(scene_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.user_id == current_user.id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Escena no encontrada")
    return scene

@router.put("/{scene_id}", response_model=SceneSchema)
def update_scene(scene_id: int, scene_update: SceneUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_scene = db.query(Scene).filter(Scene.id == scene_id, Scene.user_id == current_user.id).first()
    if not db_scene:
        raise HTTPException(status_code=404, detail="Escena no encontrada")
    
    update_data = scene_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_scene, key, value)
        
    db.commit()
    db.refresh(db_scene)
    return db_scene
