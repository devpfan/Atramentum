from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime

class SceneBase(BaseModel):
    title: str
    order: Optional[int] = 1
    content: Optional[str] = None
    beats: Optional[List[Dict[str, Any]]] = None # Lista de beats u objetos JSON
    pov: Optional[str] = None
    status: Optional[str] = "Draft"

class SceneCreate(SceneBase):
    chapter_id: int

class SceneUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None
    content: Optional[str] = None
    beats: Optional[List[Dict[str, Any]]] = None
    pov: Optional[str] = None
    status: Optional[str] = None

class Scene(SceneBase):
    id: int
    chapter_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
