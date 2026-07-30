from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SeriesBase(BaseModel):
    title: str
    description: Optional[str] = None

class SeriesCreate(SeriesBase):
    pass

class SeriesUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Series(SeriesBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
