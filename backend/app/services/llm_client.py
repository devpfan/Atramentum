import google.generativeai as genai
from app.core.config import settings

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

async def generate_stream(system_prompt: str, user_prompt: str):
    """
    Llama a Gemini usando el SDK y hace yield de la respuesta (Streaming).
    """
    model = genai.GenerativeModel('gemini-flash-latest')
    
    # Combinamos el contexto del sistema con la petición del usuario
    combined_prompt = f"CONTEXTO/INSTRUCCIONES DEL SISTEMA:\n{system_prompt}\n\n---\nPETICIÓN DEL USUARIO:\n{user_prompt}"
    
    response = await model.generate_content_async(
        combined_prompt,
        stream=True
    )
    
    async for chunk in response:
        if chunk.text:
            yield chunk.text
