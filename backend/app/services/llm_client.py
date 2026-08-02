import json
import litellm
from litellm import acompletion, aembedding
from app.core.config import settings
from sqlalchemy.orm import Session
from app.models.settings import GlobalSettings

def get_merged_ai_settings(user_settings: dict, db: Session) -> dict:
    """Merges user AI settings with Global settings. User settings take precedence."""
    merged = dict(user_settings) if user_settings else {}
    
    # Check global settings
    global_provider = db.query(GlobalSettings).filter(GlobalSettings.key == "global_ai_provider").first()
    global_gemini_key = db.query(GlobalSettings).filter(GlobalSettings.key == "global_gemini_key").first()
    global_openai_key = db.query(GlobalSettings).filter(GlobalSettings.key == "global_openai_key").first()
    global_anthropic_key = db.query(GlobalSettings).filter(GlobalSettings.key == "global_anthropic_key").first()
    global_local_url = db.query(GlobalSettings).filter(GlobalSettings.key == "global_local_url").first()
    global_local_model = db.query(GlobalSettings).filter(GlobalSettings.key == "global_local_model").first()
    
    # Si el usuario NO tiene un provider seteado con llaves validas, usamos el global como fallback
    has_user_keys = bool(merged.get("gemini_key") or merged.get("openai_key") or merged.get("anthropic_key") or merged.get("local_url"))
    
    if not has_user_keys and global_provider:
        merged["provider"] = global_provider.value
        if global_gemini_key:
            merged["gemini_key"] = global_gemini_key.value
        if global_openai_key:
            merged["openai_key"] = global_openai_key.value
        if global_anthropic_key:
            merged["anthropic_key"] = global_anthropic_key.value
        if global_local_url:
            merged["local_url"] = global_local_url.value
        if global_local_model:
            merged["local_model"] = global_local_model.value
            
    return merged

def get_litellm_args(ai_settings: dict):
    provider = ai_settings.get("provider", "gemini")
    args = {}
    if provider == "gemini":
        args["model"] = "gemini/gemini-flash-lite-latest"
        args["api_key"] = ai_settings.get("gemini_key") or settings.GEMINI_API_KEY
    elif provider == "openai":
        args["model"] = "gpt-4o-mini"
        args["api_key"] = ai_settings.get("openai_key") or settings.OPENAI_API_KEY
    elif provider == "anthropic":
        args["model"] = "claude-3-5-haiku-latest"
        args["api_key"] = ai_settings.get("anthropic_key") or settings.ANTHROPIC_API_KEY
    elif provider == "local":
        local_url = ai_settings.get("local_url") or "http://localhost:11434"
        local_model = ai_settings.get("local_model") or "llama3:8b"
        clean_url = local_url.strip().rstrip("/")
        
        # Si es Ollama (puerto 11434 por defecto), usamos el provider nativo de litellm 'ollama/'
        if "11434" in clean_url or not clean_url.endswith("/v1"):
            if clean_url.endswith("/v1"):
                clean_url = clean_url[:-3]
            args["model"] = f"ollama/{local_model}"
            args["api_base"] = clean_url
        else:
            args["model"] = f"openai/{local_model}"
            args["api_base"] = clean_url
            args["api_key"] = "dummy-key"
    else:
        args["model"] = "gemini/gemini-flash-lite-latest"
        args["api_key"] = settings.GEMINI_API_KEY
    
    return args

SCENE_STYLE_PROMPTS = {
    "novelist": (
        "Eres un novelista profesional y maestro de la narrativa literaria.\n"
        "Tu misión es redactar la escena completa en prosa inmersiva siguiendo fielmente los beats (eventos clave).\n"
        "REGLAS:\n"
        "- Aplica rigurosamente la regla: 'Muestra, no cuentes' (Show, don't tell).\n"
        "- Escribe diálogos naturales con subtexto, ritmo y voces diferenciadas.\n"
        "- Construye descripciones sensoriales vivas (atmósfera, olores, texturas) sin sobrecargar el ritmo.\n"
        "- NO incluyas introducciones, resúmenes ni comentarios explicativos. Escribe DIRECTAMENTE el texto de la novela."
    ),
    "grimdark": (
        "Eres un autor especializado en Fantasía Oscura y género Grimdark.\n"
        "Tu misión es redactar la escena con una atmósfera cruda, visceral, decadente y psicológicamente intensa.\n"
        "REGLAS:\n"
        "- Destaca las texturas ásperas, el desgaste físico, el peligro latente y los dilemas morales de los personajes.\n"
        "- Diálogos cortantes, directos y cargados de tensión.\n"
        "- NO incluyas introducciones ni resúmenes. Escribe DIRECTAMENTE el texto de la novela."
    ),
    "noir": (
        "Eres un maestro de la novela negra, thriller policíaco y suspense Noir.\n"
        "Tu misión es redactar la escena con oraciones afiladas, ritmo pausado y atmósfera densa.\n"
        "REGLAS:\n"
        "- Emplea contrastes de luces y sombras, lluvia, humo, cinismo y silencios elocuentes.\n"
        "- Diálogos inteligentes con doble sentido y tensión soterrada.\n"
        "- NO incluyas introducciones ni resúmenes. Escribe DIRECTAMENTE el texto de la novela."
    ),
    "epic": (
        "Eres un autor consagrado de Alta Fantasía y Épica Clásica.\n"
        "Tu misión es redactar la escena con una prosa solemne, majestuosa y evocadora.\n"
        "REGLAS:\n"
        "- Cuida la resonancia mítica del mundo, la grandeza del entorno y la trascendencia de cada acción.\n"
        "- Diálogos elocuentes y cargados de propósito.\n"
        "- NO incluyas introducciones ni resúmenes. Escribe DIRECTAMENTE el texto de la novela."
    ),
    "action": (
        "Eres un especialista en narrativa trepidante y escenas de acción de alto impacto.\n"
        "Tu misión es redactar la escena con ritmo vertiginoso y tensión constante.\n"
        "REGLAS:\n"
        "- Utiliza oraciones breves, verbos de acción dinámicos y sensaciones inmediatas (adrenalina, impacto, velocidad).\n"
        "- Sin pausas innecesarias; avance implacable de la acción.\n"
        "- NO incluyas introducciones ni resúmenes. Escribe DIRECTAMENTE el texto de la novela."
    ),
}

async def generate_scene_text(
    context: str, 
    prompt: str, 
    ai_settings: dict, 
    style: str = "novelist", 
    custom_style_prompt: str = None
):
    """
    Genera el texto de una escena usando el contexto RAG inyectado junto a una directiva de estilo literario.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         yield f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}."
         return

    # Determinar la directiva de estilo
    if style == "custom" and custom_style_prompt:
        style_directive = (
            f"Eres un escritor de ficción profesional. Sigue estrictamente esta directriz de estilo del autor:\n"
            f"{custom_style_prompt}\n"
            f"- Escribe DIRECTAMENTE el texto de la escena en prosa sin introducciones ni resúmenes."
        )
    else:
        style_directive = SCENE_STYLE_PROMPTS.get(style, SCENE_STYLE_PROMPTS["novelist"])

    system_prompt = f"{style_directive}\n\n{context}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    try:
        response = await acompletion(
            messages=messages,
            stream=True,
            **args
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error al generar con {ai_settings.get('provider')}: {str(e)}"

async def edit_selected_text(selected_text: str, instruction: str, ai_settings: dict):
    """
    Toma un texto seleccionado, lo envía al LLM con una instrucción y devuelve el texto modificado.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         yield f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}."
         return
         
    system_prompt = (
        "Eres un asistente de escritura. Se te proveerá un fragmento de texto seleccionado "
        "y una instrucción de cómo editarlo. Devuelve ÚNICAMENTE el texto editado sin comentarios adicionales."
    )
    user_prompt = f"TEXTO SELECCIONADO:\n{selected_text}\n\nINSTRUCCIÓN:\n{instruction}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        response = await acompletion(
            messages=messages,
            stream=True,
            **args
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error al editar con {ai_settings.get('provider')}: {str(e)}"

async def chat_with_assistant(context: str, messages: list, ai_settings: dict, persona: str = "cowriter"):
    """
    Maneja el chat interactivo usando el historial de mensajes y una 'persona' específica.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         yield f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}."
         return
         
    # Definir los prompts según la persona seleccionada
    persona_prompts = {
        "cowriter": "Eres un asistente de escritura e IA integrado en una aplicación estilo Novelcrafter. Tu objetivo es ayudar al autor de forma amigable a desarrollar su historia, dar ideas creativas y asistir en la prosa.",
        "critic": "Eres un crítico literario estricto y analítico. Tu objetivo es encontrar fallos en el ritmo, agujeros de guion (plot holes), inconsistencias y debilidades en la prosa del autor. Sé directo y constructivo.",
        "reader": "Eres un Lector de Prueba (Beta Reader) y fan apasionado. Reaccionas al texto como lo haría un lector: te emocionas, te asustas y das feedback sobre qué partes te atraparon más o te aburrieron.",
        "editor": "Eres un editor profesional. Te enfocas rigurosamente en la gramática, sintaxis, estructura de oraciones, tono y estilo. Tu retroalimentación debe ser precisa y orientada a pulir el manuscrito final."
    }
    
    base_persona_prompt = persona_prompts.get(persona)
    
    if not base_persona_prompt:
        custom_personas = ai_settings.get("custom_personas", [])
        for cp in custom_personas:
            if cp.get("id") == persona:
                base_persona_prompt = cp.get("prompt")
                break
                
    if not base_persona_prompt:
        base_persona_prompt = persona_prompts["cowriter"]
    
    system_prompt = (
        f"{base_persona_prompt}\n\n"
        f"Utiliza el siguiente contexto si es relevante para responder:\n"
        f"{context}\n\n"
        "Responde de forma útil usando formato Markdown si es necesario."
    )
    
    formatted_contents = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.role if hasattr(msg, 'role') else msg['role']
        content = msg.content if hasattr(msg, 'content') else msg['content']
        if role == 'model':
            role = 'assistant'
        formatted_contents.append({"role": role, "content": content})
        
    try:
        response = await acompletion(
            messages=formatted_contents,
            stream=True,
            **args
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error en el chat con {ai_settings.get('provider')}: {str(e)}"

async def extract_characters(text: str, ai_settings: dict) -> list:
    """
    Extrae personajes de un bloque de texto y devuelve una lista de diccionarios.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         raise ValueError(f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}.")
         
    system_prompt = (
        "Eres un experto analista literario. Tu trabajo es leer un texto y extraer TODOS los personajes mencionados. "
        "Devuelve EXCLUSIVAMENTE un arreglo JSON válido sin formato markdown ni explicaciones adicionales, "
        "con la siguiente estructura estricta:\n"
        "[\n"
        "  {\n"
        "    \"name\": \"Nombre del personaje\",\n"
        "    \"description\": \"Breve descripción física y psicológica o su rol (1 o 2 frases).\",\n"
        "    \"aliases\": [\"Apodo1\", \"Solo el nombre\", \"Título\"]\n"
        "  }\n"
        "]"
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"TEXTO DEL LIBRO:\n\n{text}"}
    ]
    
    try:
        response = await acompletion(
            messages=messages,
            **args
        )
        content = response.choices[0].message.content.strip()
        # Clean potential markdown formatting
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        
        parsed = json.loads(content.strip())
        if isinstance(parsed, list):
            return parsed
        return []
    except Exception as e:
        print(f"Error extrayendo personajes: {str(e)}")
        return []

async def get_embedding(text: str, ai_settings: dict) -> list[float]:
    """
    Genera un vector matemático (embedding) a partir de un texto.
    Por defecto usa models/text-embedding-004 de Gemini, que produce 768 dimensiones.
    """
    provider = ai_settings.get("provider", "gemini")
    
    # Configuramos los parámetros según el proveedor
    args = {}
    if provider == "gemini":
        args["model"] = "gemini/text-embedding-004"
        args["api_key"] = ai_settings.get("gemini_key") or settings.GEMINI_API_KEY
    elif provider == "openai":
        args["model"] = "text-embedding-3-small"
        args["api_key"] = ai_settings.get("openai_key")
    elif provider == "local":
        args["model"] = "openai/nomic-embed-text" # Ejemplo de modelo de embeddings local (requiere 768 dim si usamos pgvector 768)
        args["api_base"] = ai_settings.get("local_url", "http://localhost:11434/v1")
        args["api_key"] = "dummy"
    else:
        args["model"] = "gemini/text-embedding-004"
        args["api_key"] = settings.GEMINI_API_KEY
        
    try:
        response = await aembedding(
            input=[text],
            **args
        )
        # Retorna la lista de floats (el vector)
        return response.data[0]["embedding"]
    except Exception as e:
        print(f"Error generando embedding: {str(e)}")
        # Devuelve vector nulo si falla
        return []
