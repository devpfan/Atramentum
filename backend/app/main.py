from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import codex, scenes, analyze, ai, auth, manuscript, series, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(codex.router, prefix=f"{settings.API_V1_STR}/codex", tags=["codex"])
app.include_router(scenes.router, prefix=f"{settings.API_V1_STR}/scenes", tags=["scenes"])
app.include_router(manuscript.router, prefix=f"{settings.API_V1_STR}/manuscript", tags=["manuscript"])
app.include_router(analyze.router, prefix=f"{settings.API_V1_STR}/analyze", tags=["analyze"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(series.router, prefix=f"{settings.API_V1_STR}/series", tags=["series"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def root():
    return {"mensaje": "Bienvenido a la API de Atramentum"}

@app.get("/health")
def health_check():
    return {"estado": "ok"}
