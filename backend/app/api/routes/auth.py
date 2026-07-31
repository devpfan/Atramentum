from pydantic import BaseModel
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.api.deps import get_current_user
from app.models.user import User
from app.models.settings import GlobalSettings
from app.schemas.user import UserCreate, UserResponse, Token, UserEmailUpdate, UserPasswordUpdate

router = APIRouter()

@router.put("/me/email", response_model=UserResponse)
def update_email(email_data: UserEmailUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.email == email_data.new_email).first()
    if user:
        raise HTTPException(status_code=400, detail="Este correo ya está en uso.")
    
    current_user.email = email_data.new_email
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password", response_model=UserResponse)
def update_password(password_data: UserPasswordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el registro está permitido
    allow_reg_setting = db.query(GlobalSettings).filter(GlobalSettings.key == "allow_public_registration").first()
    if allow_reg_setting and allow_reg_setting.value == "false":
        # Check if there are no users at all (allow first user to register anyway)
        total_users = db.query(User).count()
        if total_users > 0:
            raise HTTPException(status_code=403, detail="El registro público está deshabilitado por el administrador.")

    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Un usuario con este email ya existe.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        ai_settings={"provider": "gemini"}
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class AISettingsSchema(BaseModel):
    provider: str
    gemini_key: str | None = None
    openai_key: str | None = None
    anthropic_key: str | None = None
    local_url: str | None = None

@router.get("/me/ai-settings", response_model=AISettingsSchema)
def get_ai_settings(current_user: User = Depends(get_current_user)):
    return current_user.ai_settings or {"provider": "gemini"}

@router.put("/me/ai-settings", response_model=AISettingsSchema)
def update_ai_settings(settings: AISettingsSchema, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy.orm.attributes import flag_modified
    current_user.ai_settings = settings.model_dump()
    flag_modified(current_user, "ai_settings")
    db.commit()
    db.refresh(current_user)
    return current_user.ai_settings

@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, devuelve el access_token para futuras llamadas.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }
