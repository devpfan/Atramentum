# =============================================================
# Stage 1: Compilar Frontend (React + Vite + TypeScript)
# =============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_URL=/api/v1
RUN npm run build

# =============================================================
# Stage 2: Backend + Servidor Unificado (FastAPI)
# =============================================================
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar Poetry
RUN pip install --no-cache-dir poetry

# Copiar archivos de dependencias del backend
COPY backend/pyproject.toml backend/poetry.lock* /app/

# Configurar Poetry e instalar dependencias directamente en el entorno global del contenedor
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-root --only main

# Copiar código del backend
COPY backend/ /app/

# Copiar el Frontend compilado desde la etapa 1 a /app/frontend_dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend_dist

# Puerto para Google Cloud Run (por defecto 8080)
ENV PORT=8080
EXPOSE 8080

# Iniciar servidor Uvicorn
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
