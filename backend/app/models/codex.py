from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector
from .base import Base
import enum

class CodexCategory(str, enum.Enum):
    CHARACTER = "Character"
    LOCATION = "Location"
    OBJECT = "Object"
    FACTION = "Faction"
    CONCEPT = "Concept"

class CodexEntry(Base):
    """
    Ficha principal del Codex (Personajes, Lugares, Objetos, Facciones, Conceptos).
    """
    __tablename__ = "codex_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(Enum(CodexCategory), nullable=False)
    description = Column(Text, nullable=True) # Descripción detallada de la entidad
    attributes = Column(JSONB, nullable=True) # Atributos adicionales como JSON
    
    # Campo vectorial para búsqueda semántica (768 dimensiones es el estándar para Gemini embeddings)
    embedding = Column(Vector(768), nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    aliases = relationship("CodexAlias", back_populates="entry", cascade="all, delete-orphan")

class CodexAlias(Base):
    """
    Alias o sinónimos asociados a una ficha del Codex para el auto-etiquetado.
    Por ejemplo: "Arturo", "El Rey", "Arturo Pendragon" -> apuntan a la misma entrada.
    """
    __tablename__ = "codex_aliases"

    id = Column(Integer, primary_key=True, index=True)
    alias_name = Column(String, index=True, nullable=False, unique=True)
    entry_id = Column(Integer, ForeignKey("codex_entries.id"), nullable=False)

    entry = relationship("CodexEntry", back_populates="aliases")
