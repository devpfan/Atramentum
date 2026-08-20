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

# --- Estado y Pruebas de IA Global ---
def mask_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    key_str = key.strip()
    if len(key_str) <= 8:
        return "••••••••"
    return f"{key_str[:6]}••••••••{key_str[-4:]}"

class AiTestRequest(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    local_url: Optional[str] = None
    local_model: Optional[str] = None

@router.get("/ai-status")
def get_ai_status(db: Session = Depends(get_db)):
    from app.core.config import settings as app_settings
    
    settings_db = {s.key: s.value for s in db.query(GlobalSettings).all()}
    active_provider = settings_db.get("global_ai_provider", "gemini")
    
    # Gemini
    db_gemini = settings_db.get("global_gemini_key")
    env_gemini = app_settings.GEMINI_API_KEY
    gemini_source = "db" if db_gemini else ("env" if env_gemini else "none")
    gemini_key = db_gemini or env_gemini
    
    # OpenAI
    db_openai = settings_db.get("global_openai_key")
    env_openai = app_settings.OPENAI_API_KEY
    openai_source = "db" if db_openai else ("env" if env_openai else "none")
    openai_key = db_openai or env_openai
    
    # Anthropic
    db_anthropic = settings_db.get("global_anthropic_key")
    env_anthropic = app_settings.ANTHROPIC_API_KEY
    anthropic_source = "db" if db_anthropic else ("env" if env_anthropic else "none")
    anthropic_key = db_anthropic or env_anthropic
    
    # Local
    local_url = settings_db.get("global_local_url", "http://localhost:11434")
    local_model = settings_db.get("global_local_model", "llama3:8b")
    
    # Modelo activo
    active_model = "gemini/gemini-flash-lite-latest"
    if active_provider == "openai":
        active_model = "gpt-4o-mini"
    elif active_provider == "anthropic":
        active_model = "claude-3-5-haiku-latest"
    elif active_provider == "local":
        active_model = f"ollama/{local_model}"
        
    return {
        "active_provider": active_provider,
        "active_model": active_model,
        "providers": {
            "gemini": {
                "name": "Google Gemini",
                "configured": bool(gemini_key),
                "source": gemini_source,
                "masked_key": mask_key(gemini_key),
                "model": "gemini/gemini-flash-lite-latest"
            },
            "openai": {
                "name": "OpenAI (ChatGPT)",
                "configured": bool(openai_key),
                "source": openai_source,
                "masked_key": mask_key(openai_key),
                "model": "gpt-4o-mini"
            },
            "anthropic": {
                "name": "Anthropic (Claude)",
                "configured": bool(anthropic_key),
                "source": anthropic_source,
                "masked_key": mask_key(anthropic_key),
                "model": "claude-3-5-haiku-latest"
            },
            "local": {
                "name": "Ollama (Local / Offline)",
                "configured": bool(local_url and local_model),
                "url": local_url,
                "model": local_model
            }
        }
    }

@router.post("/ai-test")
async def test_ai_connection(req: Optional[AiTestRequest] = None, db: Session = Depends(get_db)):
    import time
    from app.services.llm_client import get_litellm_args, acompletion

    settings_db = {s.key: s.value for s in db.query(GlobalSettings).all()}
    
    provider = (req.provider if req and req.provider else None) or settings_db.get("global_ai_provider", "gemini")
    
    ai_dict = {"provider": provider}
    if req and req.api_key:
        if provider == "gemini":
            ai_dict["gemini_key"] = req.api_key
        elif provider == "openai":
            ai_dict["openai_key"] = req.api_key
        elif provider == "anthropic":
            ai_dict["anthropic_key"] = req.api_key
    else:
        if provider == "gemini":
            ai_dict["gemini_key"] = settings_db.get("global_gemini_key")
        elif provider == "openai":
            ai_dict["openai_key"] = settings_db.get("global_openai_key")
        elif provider == "anthropic":
            ai_dict["anthropic_key"] = settings_db.get("global_anthropic_key")

    if provider == "local":
        ai_dict["local_url"] = (req.local_url if req and req.local_url else None) or settings_db.get("global_local_url", "http://localhost:11434")
        ai_dict["local_model"] = (req.local_model if req and req.local_model else None) or settings_db.get("global_local_model", "llama3:8b")

    args = get_litellm_args(ai_dict)
    
    start_time = time.time()
    try:
        res = await acompletion(
            **args,
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=3
        )
        latency_ms = int((time.time() - start_time) * 1000)
        return {
            "ok": True,
            "provider": provider,
            "model": args.get("model"),
            "latency_ms": latency_ms,
            "message": f"Conexión exitosa con {provider.capitalize()} ({args.get('model')}). Tiempo de respuesta: {latency_ms}ms"
        }
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        err_raw = str(e)
        if "prepayment credits are depleted" in err_raw or "RESOURCE_EXHAUSTED" in err_raw or "429" in err_raw:
            err_msg = "⚠️ Cuota o créditos agotados en tu API Key de Gemini (Error 429: RESOURCE_EXHAUSTED). Visita https://ai.studio/projects para revisar tu facturación o ingresa una nueva API Key de Gemini."
        else:
            err_msg = err_raw
        return {
            "ok": False,
            "provider": provider,
            "model": args.get("model"),
            "latency_ms": latency_ms,
            "error": err_msg
        }

