# Atramentum 

Atramentum es una aplicación inteligente de asistencia a la escritura diseñada específicamente para novelistas, escritores y creadores de mundos. Fusiona la gestión estructural tradicional de un manuscrito con el poder de la Inteligencia Artificial para acelerar el proceso creativo sin perder el control autoral.

## Características Principales 

*   **Gestión Multi-Proyecto:** Organiza múltiples libros o proyectos literarios de forma independiente en una sola cuenta.
*   **Gestión de Manuscritos Estructurada:** Divide tu obra en Actos, Capítulos y Escenas con un árbol de navegación intuitivo.
*   **El Archivum (Biblia de la Historia):** Un repositorio multimedia dedicado para el *lore* de tu historia. Crea entradas para Personajes, Lugares, Objetos y Conceptos, e ilustra sus perfiles con retratos e imágenes (soporte integrado).
*   **Generador de Prosa Asistido por "Beats":** ¿Tienes claro qué va a pasar en una escena pero no sabes cómo escribirlo? Escribe una lista de eventos clave (Beats) y la Inteligencia Artificial redactará la prosa en tiempo real, inyectando automáticamente en el contexto la información de tu Archivum (RAG - *Retrieval-Augmented Generation*).
*   **Escáner Inteligente:** Atramentum puede leer tus capítulos y poblar el Archivum automáticamente detectando personajes que aún no tengas registrados.
*   **Editor de Texto Enriquecido:** Un entorno de escritura limpio y sin distracciones, con autoguardado y autocompletado inteligente de etiquetas. Al pasar el ratón por los personajes etiquetados, verás su información e imagen en una ventana flotante.
*   **Asistente Inteligente (AtrIA):** Un panel de chat integrado donde puedes hablar con la IA sobre tu novela. Puedes crear "Roles de IA" o "Personas" totalmente personalizables (Ej: crea un crítico literario despiadado o un co-escritor entusiasta) definiendo sus instrucciones del sistema (System Prompts).
*   **Edición Asistida con Vista Previa (Inline Preview):** Reescribe, expande o resume fragmentos de tu texto con IA, y revisa la sugerencia antes de aplicarla.
*   **Sistema de Administración y Multiusuario:** Soporte multi-cuenta con control de acceso basado en roles (RBAC). El Superusuario puede configurar los modelos de IA globales y gestionar las cuentas.
*   **Soporte Multi-Modelo:** Diseñado con una arquitectura modular para integrarse con diferentes Grandes Modelos de Lenguaje (LLMs) según tus preferencias (Gemini, OpenAI, Ollama).
*   **Exportación Universal:** Compila tu manuscrito en cuestión de segundos a múltiples formatos listos para publicar o revisar: Markdown, Word (.docx), PDF y EPUB (100% compatible con Amazon Kindle).
*   **Estadísticas y Metas:** Mantén la motivación visualizando tu progreso en tiempo real con barras de progreso y conteo de palabras inteligente.
*   **Personalización Visual:** Interfaz de usuario altamente estética y adaptable con 7 modos de color distintos (Oscuro, Claro, Sepia, Océano, Bosque, Vino y Lavanda).

## Guía de Uso Rápido 🚀

### 1. Panel de Administración y Configuración Global
- Inicia sesión con la cuenta de superusuario (la primera cuenta registrada o la que configures en la base de datos).
- Dirígete a la URL `/admin` para acceder al panel de control.
- En la pestaña **Ajustes de IA**, configura las claves globales de tus proveedores de LLM preferidos (Gemini, OpenAI, Anthropic o Ollama Local). Esto actuará como *fallback* para todos los usuarios.

### 2. Creación de Roles de IA (Personas) Personalizados
- Dentro del proyecto, abre el panel de **AtrIA** (Asistente Chat) ubicado en el Inspector de Escenas o en la barra lateral.
- Haz clic en el ícono del engranaje ⚙️ para abrir los ajustes del chat.
- Haz clic en **"Gestionar Mis Roles..."**.
- Añade un nombre y unas **Instrucciones del Sistema (Prompt)** muy detalladas para tu nueva persona (Ej: "Eres un lector sarcástico que detesta los clichés de fantasía").
- Una vez guardado, selecciónalo en el menú desplegable "Roles" para que la IA actúe como tu creación.

### 3. Imágenes en el Archivum
- Navega a la pestaña del **Codex** y crea una entrada (ej: personaje o lugar).
- Haz clic en el área punteada de "Subir Imagen" o arrastra tu archivo (máx 500KB) para añadirle un retrato visual.
- Cuando escribas su nombre en el **Editor de Manuscrito** y pases el ratón sobre el texto resaltado, aparecerá su retrato flotando junto a su descripción.

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
