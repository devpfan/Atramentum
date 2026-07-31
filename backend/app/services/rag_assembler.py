import json
from sqlalchemy.orm import Session
from app.models.manuscript import Scene
from app.models.codex import CodexEntry

def assemble_context(scene_id: int, user_id: int, db: Session, context_settings: dict = None) -> str:
    """
    Ensambla el System Prompt inyectando los beats de la escena, 
    el texto escrito previamente, y la información del Archivum (Codex) según la configuración.
    """
    if context_settings is None:
        context_settings = {"include_archivum": True, "include_beats": True, "include_manuscript": True}
        
    context_lines = []
    context_lines.append("CONTEXTO DE LA HISTORIA Y MANUSCRITO:")
    
    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.user_id == user_id).first()
    if scene:
        if scene.beats and context_settings.get("include_beats", True):
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
        
    # Agregamos la información del Archivum al contexto (Lore)
    entries = []
    if scene and context_settings.get("include_archivum", True):
        entries = db.query(CodexEntry).filter(CodexEntry.book_id == scene.chapter.act.book_id).all()
    
    if entries:
        context_lines.append("\n--- LORE DEL MUNDO (ARCHIVUM) ---")
        for entry in entries:
            desc = entry.description or ""
            context_lines.append(f"[{entry.category.value}] {entry.name}: {desc}")

    return "\n".join(context_lines)
