# Atramentum Frontend 🎨

Esta es la interfaz de usuario de Atramentum, construida para ser un entorno de escritura sin distracciones, altamente interactivo y dinámicamente acoplado al Codex de la historia y a la inteligencia artificial.

## Stack Tecnológico 🛠️

*   **React 18 & TypeScript:** Bibliotecas base. Tipado estático para asegurar la integridad de los datos en toda la aplicación.
*   **Vite:** Empaquetador extremadamente rápido para un desarrollo ágil y compilaciones optimizadas.
*   **Zustand:** Sistema de gestión de estado global ligero y directo. Gestiona la caché local y la sincronización con el backend sin el "boilerplate" de Redux.
*   **Tailwind CSS:** Framework utilitario para un diseño rápido, responsivo y adaptado al esquema de colores (variables CSS nativas) del entorno *Dark Mode* de Atramentum.
*   **Tiptap:** Framework "headless" basado en ProseMirror. Utilizado para construir el editor de texto enriquecido del manuscrito y permitir extensiones personalizadas (como el sistema de AutoTagging del Codex).
*   **React Router DOM:** Manejo de rutas y redirecciones para la navegación tipo SPA (Single Page Application).

## Arquitectura de Directorios 📂

```text
frontend/
├── src/
│   ├── api/              # Clientes HTTP axios/fetch fuertemente tipados
│   ├── features/         # Módulos organizados por dominio
│   │   ├── auth/         # Pantallas de Login y Registro
│   │   ├── layout/       # Estructura principal (Sidebar, Navegación)
│   │   ├── editor/       # Tiptap, Gestor de Árbol (Tree), Inspector de Escena
│   │   └── codex/        # Lista y Editor de Entradas del Lorebook
│   ├── store/            # Stores de Zustand (Autenticación, Manuscrito, Codex)
│   └── types/            # Tipos e interfaces globales de TypeScript
└── index.css             # Variables CSS globales y utilidades base de Tailwind
```

## Flujos Principales 🔄

### 1. Gestión de Estado Global (`store/`)
Utilizamos **Zustand** para crear *stores* modulares:
*   `useAppStore`: Gestiona el token de autenticación JWT.
*   `useManuscriptStore`: Controla el proyecto activo (`activeBookId`), mantiene el árbol del manuscrito (Capítulos/Escenas) en memoria y gestiona la escena que el usuario está editando actualmente (`activeSceneId`).
*   `useCodexStore`: Obtiene y filtra las entradas del Codex basadas en el proyecto seleccionado, permitiendo búsquedas rápidas (alias) en el texto del manuscrito.

### 2. Editor de Texto Interactivo (Tiptap)
*   **Ubicación:** `features/editor/`
*   **Flujo de AutoTagging:** A medida que el usuario escribe, una extensión personalizada de Tiptap lee los "Alias" registrados en el store del Codex y subraya o etiqueta visualmente (Menciones) las palabras en el texto del manuscrito sin alterar los datos crudos.
*   **Autoguardado:** El editor utiliza una técnica de `debounce` para enviar actualizaciones incrementales al backend y sincronizar el estado global en segundo plano sin interrumpir al escritor.

### 3. El Inspector de Escenas y Streaming (Beats)
*   **Ubicación:** `features/editor/SceneInspector.tsx`
*   **Flujo:** 
    1. El usuario introduce líneas de texto (Beats) en el panel derecho.
    2. Al hacer clic en "Generar Prosa", el frontend envía los beats al backend.
    3. El backend responde con un *Stream* (Server-Sent Events / Event-Stream).
    4. El frontend intercepta el flujo de bytes asíncrono, lo decodifica y lo "inyecta" directamente en el editor Tiptap en tiempo real simulando a un escritor fantasma, hasta que la transmisión termina y guarda automáticamente.

## Comandos Útiles

*   **Instalar dependencias:** `npm install`
*   **Iniciar servidor local:** `npm run dev`
*   **Construir para producción:** `npm run build`
