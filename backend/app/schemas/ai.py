from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GenerateSceneRequest(BaseModel):
    scene_id: int
    prompt: str

class EditInlineRequest(BaseModel):
    selected_text: str
    instruction: str

class ChatMessageBase(BaseModel):
    role: str # 'user' or 'model'
    content: str

class ChatMessage(ChatMessageBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    # Only need to send the current message, but if we send history it's fine.
    messages: list[ChatMessage]
    scene_id: int | None = None
