import re
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from app.models.manuscript import Scene, SceneChunk
from app.models.user import User
from app.services.llm_client import get_embedding, get_merged_ai_settings

def chunk_html_text(html_content: str, max_words_per_chunk: int = 200) -> list[str]:
    """
    Extrae texto limpio de HTML y lo divide en chunks aproximadamente del tamaño max_words_per_chunk.
    Intenta no cortar párrafos por la mitad si es posible.
    """
    if not html_content:
        return []
        
    soup = BeautifulSoup(html_content, "html.parser")
    # Agrupamos el texto por bloques de párrafos
    paragraphs = []
    for p in soup.find_all(['p', 'h1', 'h2', 'h3']):
        text = p.get_text(strip=True)
        if text:
            paragraphs.append(text)
            
    # Si no hay párrafos (texto sin etiquetas), partimos en líneas
    if not paragraphs:
        text = soup.get_text(strip=True)
        if not text:
            return []
        paragraphs = [t.strip() for t in text.split('\n') if t.strip()]

    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for p in paragraphs:
        p_word_count = len(p.split())
        
        if current_word_count + p_word_count > max_words_per_chunk and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p]
            current_word_count = p_word_count
        else:
            current_chunk.append(p)
            current_word_count += p_word_count
            
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
        
    return chunks

async def sync_scene_embeddings(scene_id: int, user_id: int, db: Session):
    """
    Sincroniza los chunks y embeddings de una escena.
    Diseñado para correr como BackgroundTask.
    """
    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.user_id == user_id).first()
    if not scene or not scene.content:
        return
        
    user = db.query(User).filter(User.id == user_id).first()
    ai_settings = get_merged_ai_settings(user.ai_settings, db)

    # 1. Extraer nuevos chunks
    text_chunks = chunk_html_text(scene.content)
    
    # 2. Borrar chunks antiguos de la BD
    db.query(SceneChunk).filter(SceneChunk.scene_id == scene_id).delete()
    db.commit()
    
    # 3. Generar y guardar nuevos chunks
    for index, text in enumerate(text_chunks):
        embedding_vector = await get_embedding(text, ai_settings)
        if embedding_vector:
            new_chunk = SceneChunk(
                scene_id=scene_id,
                chunk_index=index,
                content=text,
                embedding=embedding_vector
            )
            db.add(new_chunk)
            
    db.commit()

async def search_semantic_context(query: str, book_id: int, user_id: int, db: Session, limit: int = 5) -> str:
    """
    Busca semánticamente en las escenas del libro y en el Codex.
    """
    user = db.query(User).filter(User.id == user_id).first()
    ai_settings = get_merged_ai_settings(user.ai_settings, db)
    
    query_vector = await get_embedding(query, ai_settings)
    if not query_vector:
        return ""
        
    # Buscar chunks de escenas del libro
    # Usamos pgvector para ordenar por cosine distance (<=>)
    from app.models.manuscript import Chapter, Act
    
    scene_chunks = db.query(SceneChunk).join(Scene).join(Chapter).join(Act).filter(
        Act.book_id == book_id,
        Scene.user_id == user_id,
        SceneChunk.embedding.isnot(None)
    ).order_by(
        SceneChunk.embedding.cosine_distance(query_vector)
    ).limit(limit).all()
    
    # Preparar el contexto recuperado
    context_lines = []
    if scene_chunks:
        context_lines.append("\n--- FRAGMENTOS RELEVANTES DEL MANUSCRITO ---")
        for chunk in scene_chunks:
            scene_title = chunk.scene.title
            context_lines.append(f"[{scene_title}]: {chunk.content}")
            
    # Podríamos también buscar en Codex si tiene embeddings, pero por ahora inyectaremos
    # el Codex de forma estándar en assemble_context o podemos mezclarlo aquí si lo deseamos.
    
    return "\n\n".join(context_lines)
