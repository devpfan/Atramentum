import json
import litellm
from litellm import acompletion
from app.core.config import settings

def get_litellm_args(ai_settings: dict):
    provider = ai_settings.get("provider", "gemini")
    args = {}
    if provider == "gemini":
        args["model"] = "gemini/gemini-1.5-flash-latest"
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
        args["model"] = "gemini/gemini-1.5-flash-latest"
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

async def chat_with_assistant(context: str, messages: list, ai_settings: dict):
    """
    Maneja el chat interactivo usando el historial de mensajes.
    """
    args = get_litellm_args(ai_settings)
    if not args.get("api_key") and not args.get("api_base"):
         yield f"Error: API Key no configurada para el proveedor {ai_settings.get('provider')}."
         return
         
    system_prompt = (
        "Eres un asistente de escritura e IA integrado en una aplicación estilo Novelcrafter. "
        "Tu objetivo es ayudar al autor a desarrollar su historia, personajes y escenas. "
        f"CONTEXTO ACTUAL DE LA HISTORIA:\n{context}\n\n"
        "Responde de forma concisa y útil."
    )
    
    formatted_contents = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.role if hasattr(msg, 'role') else msg['role']
        content = msg.content if hasattr(msg, 'content') else msg['content']
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
