import json
from sqlalchemy.orm import Session
from app.models.manuscript import Scene
from app.models.codex import CodexEntry

def assemble_context(scene_id: int, user_id: int, db: Session) -> str:
    """
    Ensambla el System Prompt inyectando los beats de la escena, 
    el texto escrito previamente, y la información del Codex (RAG).
    """
    context_lines = []
    context_lines.append("Actúa como un escritor experto y asiste al autor a redactar su libro.")
    
    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.user_id == user_id).first()
    if scene:
        if scene.beats:
            context_lines.append("\n--- BEATS DE LA ESCENA (Lo que debe suceder) ---")
            for beat in scene.beats:
                if isinstance(beat, dict) and 'content' in beat:
                    context_lines.append(f"- {beat['content']}")
                elif isinstance(beat, str):
                    context_lines.append(f"- {beat}")
                else:
                    context_lines.append(f"- {json.dumps(beat)}")
                    
        if scene.content:
            context_lines.append("\n--- TEXTO ACTUAL DE LA ESCENA ---")
            context_lines.append(scene.content)
        
    # Agregamos la información del Codex al contexto (Lore)
    entries = db.query(CodexEntry).all()
    if entries:
        context_lines.append("\n--- LORE DEL MUNDO (CODEX) ---")
        for entry in entries:
            desc = entry.description or ""
            context_lines.append(f"[{entry.category.value}] {entry.name}: {desc}")

    return "\n".join(context_lines)
