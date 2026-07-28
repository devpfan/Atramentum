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
            model='gemini-2.5-flash',
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
            model='gemini-2.5-flash',
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
