# Atramentum 

Atramentum es una aplicación inteligente de asistencia a la escritura diseñada específicamente para novelistas, escritores y creadores de mundos. Fusiona la gestión estructural tradicional de un manuscrito con el poder de la Inteligencia Artificial para acelerar el proceso creativo sin perder el control autoral.

## Características Principales 

*   **Gestión Multi-Proyecto:** Organiza múltiples libros o proyectos literarios de forma independiente en una sola cuenta.
*   **Gestión de Manuscritos Estructurada:** Divide tu obra en Actos, Capítulos y Escenas con un árbol de navegación intuitivo.
*   **El Archivum (Bíblia de la Historia):** Un repositorio dedicado para el *lore* de tu historia. Crea entradas detalladas para Personajes, Lugares, Objetos y Conceptos. El Codex es independiente para cada proyecto, manteniendo universos separados.
*   **Generador de Prosa Asistido por "Beats":** ¿Tienes claro qué va a pasar en una escena pero no sabes cómo escribirlo? Escribe una lista de eventos clave (Beats) y la Inteligencia Artificial redactará la prosa en tiempo real, inyectando automáticamente en el contexto la información de tu Codex (RAG - *Retrieval-Augmented Generation*).
*   **Editor de Texto Enriquecido:** Un entorno de escritura limpio y sin distracciones, potenciado por Tiptap, con soporte de autoguardado y autocompletado inteligente de etiquetas del Codex.
*   **Soporte Multi-Modelo:** Diseñado con una arquitectura modular para integrarse con diferentes Grandes Modelos de Lenguaje (LLMs) según tus preferencias.
*   **Exportación Universal:** Compila tu manuscrito en cuestión de segundos a múltiples formatos listos para publicar o revisar: Markdown, Word (.docx), PDF y EPUB (100% compatible con Amazon Kindle).
*   **Estadísticas y Metas:** Mantén la motivación visualizando tu progreso en tiempo real con barras de progreso y conteo de palabras inteligente.
*   **Personalización Visual:** Interfaz de usuario altamente estética y adaptable con 7 modos de color distintos (Oscuro, Claro, Sepia, Océano, Bosque, Vino y Lavanda).

## Arquitectura Técnica 

Atramentum está construido con una arquitectura moderna separada en Frontend y Backend:

### Frontend
*   **Framework:** React 18 con TypeScript + Vite
*   **Estilos:** Tailwind CSS y Lucide Icons
*   **Estado Global:** Zustand
*   **Editor:** Tiptap (ProseMirror)
*   **Enrutamiento:** React Router DOM

### Backend
*   **Framework:** FastAPI (Python)
*   **Base de Datos:** PostgreSQL con SQLAlchemy (ORM)
*   **Migraciones:** Alembic
*   **Autenticación:** JWT (JSON Web Tokens)
*   **IA:** Integración con proveedores de LLM usando flujos asíncronos (Server-Sent Events) para generación en tiempo real.

## Requisitos Previos 

*   Node.js (v18+)
*   Python (3.10+)
*   Poetry (Gestor de dependencias de Python)
*   PostgreSQL (Servidor local o remoto)

## Instalación y Configuración 

### 1. Base de Datos
Asegúrate de tener PostgreSQL ejecutándose y crea una base de datos para el proyecto.

### 2. Backend
Navega al directorio `backend` y configura el entorno:

```bash
cd backend
poetry install
```

Configura tus variables de entorno, por ejemplo `DATABASE_URL` y las claves API (API Keys) de tu modelo preferido.

Aplica las migraciones de la base de datos:
```bash
poetry run alembic upgrade head
```

Inicia el servidor de desarrollo:
```bash
poetry run uvicorn app.main:app --reload
```
El backend estará disponible en `http://localhost:8000`.

### 3. Frontend
Abre una nueva terminal, navega al directorio `frontend` e instala las dependencias:

```bash
cd frontend
npm install
```

Inicia el servidor de desarrollo de Vite:
```bash
npm run dev
```
El frontend estará disponible normalmente en `http://localhost:5173`.

## Licencia 

Todos los derechos reservados. El modelo de licenciamiento definitivo aún está por definirse.
