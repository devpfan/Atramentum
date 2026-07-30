from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, DateTime, func
from sqlalchemy.orm import relationship
from .base import Base

class Series(Base):
    __tablename__ = "series"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    books = relationship("Book", back_populates="series", cascade="all, delete-orphan")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    synopsis = Column(Text, nullable=True)
    previous_titles = Column(JSON, nullable=True, default=list) # Historial de títulos de trabajo
    target_word_count = Column(Integer, default=50000)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    series_id = Column(Integer, ForeignKey("series.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    series = relationship("Series", back_populates="books")
    acts = relationship("Act", back_populates="book", cascade="all, delete-orphan")

class Act(Base):
    """
    Representa un Acto dentro de un Libro.
    """
    __tablename__ = "acts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=1)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)

    book = relationship("Book", back_populates="acts")
    chapters = relationship("Chapter", back_populates="act", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=1)
    act_id = Column(Integer, ForeignKey("acts.id"), nullable=False)

    act = relationship("Act", back_populates="chapters")
    scenes = relationship("Scene", back_populates="chapter", cascade="all, delete-orphan")

class Scene(Base):
    """
    Unidad mínima de escritura. 
    Contiene el texto, métricas, metadatos y beats (escaleta).
    """
    __tablename__ = "scenes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    order = Column(Integer, default=1)
    
    content = Column(Text, nullable=True) # Contenido del manuscrito
    beats = Column(JSON, nullable=True) # Lista de beats (puntos clave de la escena)
    pov = Column(String, nullable=True) # Punto de vista (Point of View)
    status = Column(String, default="Draft") # Draft, In Progress, Revised, Done
    
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    chapter = relationship("Chapter", back_populates="scenes")
