from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.settings import GlobalSettings
from app.api.deps import get_current_active_superuser
from app.core.security import get_password_hash

router = APIRouter(dependencies=[Depends(get_current_active_superuser)])

# --- Schemas ---
class UserOut(BaseModel):
    id: int
    email: str
    is_active: bool
    is_superuser: bool

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    email: str
    password: str
    is_superuser: bool = False

class GlobalSettingUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class GlobalSettingOut(BaseModel):
    key: str
    value: Optional[str]
    description: Optional[str]

    class Config:
        orm_mode = True

# --- Rutas de Usuarios ---
@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.post("/users", response_model=UserOut)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_superuser=user_in.is_superuser,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

# --- Rutas de Configuración Global ---
@router.get("/settings", response_model=List[GlobalSettingOut])
def list_settings(db: Session = Depends(get_db)):
    return db.query(GlobalSettings).all()

@router.put("/settings", response_model=GlobalSettingOut)
def update_setting(setting_in: GlobalSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(GlobalSettings).filter(GlobalSettings.key == setting_in.key).first()
    if setting:
        setting.value = setting_in.value
        if setting_in.description is not None:
            setting.description = setting_in.description
    else:
        setting = GlobalSettings(
            key=setting_in.key, 
            value=setting_in.value, 
            description=setting_in.description
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting
