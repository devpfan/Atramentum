# Atramentum Backend 🧠

Este es el motor de Atramentum, encargado de gestionar la persistencia de datos, la autenticación y la orquestación de la Inteligencia Artificial mediante RAG (Retrieval-Augmented Generation). 

## Stack Tecnológico 🛠️

*   **FastAPI:** Framework web principal. Proporciona alto rendimiento, generación automática de documentación (Swagger/OpenAPI) y soporte nativo para operaciones asíncronas y *Server-Sent Events (SSE)*.
*   **SQLAlchemy:** ORM para la interacción con la base de datos relacional.
*   **PostgreSQL:** Base de datos principal. Utilizamos columnas de tipo `JSONB` para permitir esquemas flexibles en los atributos personalizados del Codex.
*   **Alembic:** Herramienta para la gestión y control de versiones (migraciones) de la base de datos.
*   **Pydantic:** Validación robusta de datos y serialización de esquemas.
*   **PyJWT & Passlib:** Manejo seguro de la autenticación mediante tokens JWT y hashing de contraseñas.

## Arquitectura de Directorios 📂

```text
backend/
├── alembic/              # Versiones de migraciones de base de datos
├── app/
│   ├── api/
│   │   ├── deps.py       # Dependencias inyectables (ej. get_db, get_current_user)
│   │   └── routes/       # Endpoints agrupados por dominio (auth, codex, manuscript, ai)
│   ├── core/
│   │   ├── config.py     # Configuraciones y variables de entorno
│   │   └── security.py   # Lógica de encriptación y JWT
│   ├── db/
│   │   └── database.py   # Configuración de sesión de SQLAlchemy
│   ├── models/           # Modelos ORM de SQLAlchemy (Tablas BD)
│   ├── schemas/          # Modelos Pydantic (Validación de I/O)
│   └── services/         # Lógica de negocio (ej. ensamblador RAG, cliente LLM)
└── main.py               # Punto de entrada de la aplicación FastAPI
```

## Flujos Principales 🔄

### 1. Gestión Multi-Proyecto y Manuscrito
*   **Dominio:** `routes/manuscript.py`
*   **Flujo:** El cliente solicita la estructura del manuscrito mandando un `book_id`. El backend devuelve una estructura en árbol (Libro -> Actos -> Capítulos -> Escenas) aplanada estratégicamente para ser procesada en el estado global del frontend.

### 2. El Codex (Base de Conocimiento Dinámica)
*   **Dominio:** `routes/codex.py`
*   **Flujo:** Las entidades del Codex (Personajes, Lugares) se almacenan filtradas por el `book_id` activo. Los atributos extra dinámicos se serializan dentro de un campo `JSONB`.

### 3. Generación Asistida por IA (RAG + SSE)
*   **Dominio:** `routes/ai.py` y `services/rag_assembler.py`
*   **Flujo:**
    1.  **Recepción:** El endpoint `/generate-scene` recibe el ID de la escena y un *prompt* que incluye los "Beats" en texto plano.
    2.  **Ensamblaje RAG:** `rag_assembler.py` consulta la base de datos para recuperar todo el lore del Codex asociado a ese libro, así como el contenido actual de la escena.
    3.  **Inyección:** Toda esta información se inyecta en las instrucciones del sistema (System Prompt) del modelo LLM.
    4.  **Streaming:** El servicio inicia la conexión con el LLM y utiliza `StreamingResponse` para enviar fragmentos de texto (chunks) al cliente en tiempo real a medida que la IA los produce.

## Comandos Útiles

*   **Crear migración:** `poetry run alembic revision --autogenerate -m "Mensaje"`
*   **Aplicar migraciones:** `poetry run alembic upgrade head`
*   **Iniciar servidor local:** `poetry run uvicorn app.main:app --reload`
