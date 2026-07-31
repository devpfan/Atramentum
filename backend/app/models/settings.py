from sqlalchemy import Column, String, Integer
from app.models.base import Base

class GlobalSettings(Base):
    __tablename__ = "global_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=True)
    description = Column(String, nullable=True)
