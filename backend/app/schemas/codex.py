from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.models.codex import CodexCategory
from datetime import datetime

class CodexAliasBase(BaseModel):
    alias_name: str

class CodexAliasCreate(CodexAliasBase):
    pass

class CodexAlias(CodexAliasBase):
    id: int
    entry_id: int

    class Config:
        from_attributes = True

class CodexEntryBase(BaseModel):
    name: str
    category: CodexCategory
    description: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    book_id: int

class CodexEntryCreate(CodexEntryBase):
    aliases: Optional[List[str]] = []

class CodexEntryUpdate(CodexEntryBase):
    name: Optional[str] = None
    category: Optional[CodexCategory] = None
    aliases: Optional[List[str]] = None

class CodexEntry(CodexEntryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    aliases: List[CodexAlias] = []

    class Config:
        from_attributes = True
