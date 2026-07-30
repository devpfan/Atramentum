from google import genai
from google.genai import types
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None

async def generate_scene_text(context: str, prompt: str):
    """
    Genera el texto de una escena usando el contexto RAG inyectado como system_instruction.
    """
    if not client:
        yield "Error: GEMINI_API_KEY no configurado."
        return

    try:
        response = await client.aio.models.generate_content_stream(
            model='gemini-flash-lite-latest',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=context,
            ),
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Error al generar con Gemini: {str(e)}"


async def edit_selected_text(selected_text: str, instruction: str):
    """
    Toma un texto seleccionado, lo envía a Gemini con una instrucción (ej. "Reescribir más triste")
    y devuelve el texto modificado.
    """
    if not client:
        yield "Error: GEMINI_API_KEY no configurado."
        return
        
    system_prompt = (
        "Eres un asistente de escritura. Se te proveerá un fragmento de texto seleccionado "
        "y una instrucción de cómo editarlo. Devuelve ÚNICAMENTE el texto editado sin comentarios adicionales."
    )
    user_prompt = f"TEXTO SELECCIONADO:\n{selected_text}\n\nINSTRUCCIÓN:\n{instruction}"
    
    try:
        response = await client.aio.models.generate_content_stream(
            model='gemini-flash-lite-latest',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Error al editar con Gemini: {str(e)}"

async def chat_with_assistant(context: str, messages: list):
    """
    Maneja el chat interactivo usando el historial de mensajes.
    El context se inyecta como system_instruction.
    """
    if not client:
        yield "Error: GEMINI_API_KEY no configurado."
        return
        
    system_prompt = (
        "Eres un asistente de escritura e IA integrado en una aplicación estilo Novelcrafter. "
        "Tu objetivo es ayudar al autor a desarrollar su historia, personajes y escenas. "
        f"CONTEXTO ACTUAL DE LA HISTORIA:\n{context}\n\n"
        "Responde de forma concisa y útil."
    )
    
    # Format messages for Gemini (it expects 'user' and 'model' roles)
    formatted_contents = []
    for msg in messages:
        # Pydantic models to dict if needed, or just access attributes
        role = msg.role if hasattr(msg, 'role') else msg['role']
        content = msg.content if hasattr(msg, 'content') else msg['content']
        formatted_contents.append({"role": role, "parts": [{"text": content}]})
        
    try:
        response = await client.aio.models.generate_content_stream(
            model='gemini-flash-lite-latest',
            contents=formatted_contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
            ),
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"Error en el chat con Gemini: {str(e)}"
