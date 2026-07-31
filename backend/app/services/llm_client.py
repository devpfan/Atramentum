import json
import litellm
from litellm import acompletion, aembedding
from app.core.config import settings

def get_litellm_args(ai_settings: dict):
    provider = ai_settings.get("provider", "gemini")
    args = {}
    if provider == "gemini":
        args["model"] = "gemini/gemini-flash-lite-latest"
        args["api_key"] = ai_settings.get("gemini_key") or settings.GEMINI_API_KEY
    elif provider == "openai":
        args["model"] = "gpt-4o-mini"
        args["api_key"] = ai_settings.get("openai_key")
    elif provider == "anthropic":
        args["model"] = "claude-3-5-haiku-latest"
        args["api_key"] = ai_settings.get("anthropic_key")
    elif provider == "local":
        args["model"] = "openai/local-model" # uses openai provider format for local servers
        args["api_base"] = ai_settings.get("local_url", "http://localhost:11434/v1")
        args["api_key"] = "dummy-key"
    else:
        args["model"] = "gemini/gemini-flash-lite-latest"
        args["api_key"] = settings.GEMINI_API_KEY
    
    return args

async def generate_scene_text(context: str, prompt: str, ai_settings: dict):
    """
    Genera el texto de una escena usando el contexto RAG inyectado como system prompt.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         yield f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}."
         return

    messages = [
        {"role": "system", "content": context},
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
    
    base_persona_prompt = persona_prompts.get(persona, persona_prompts["cowriter"])
    
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
