from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import codex

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(codex.router, prefix=f"{settings.API_V1_STR}/codex", tags=["codex"])

@app.get("/")
def root():
    return {"mensaje": "Bienvenido a la API de Atramentum"}

@app.get("/health")
def health_check():
    return {"estado": "ok"}
