import re
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.codex import CodexAlias, CodexEntry

def scan_text_for_aliases(text: str, db: Session) -> List[Dict[str, Any]]:
    """
    Escanea el texto y busca ocurrencias de todos los alias guardados en la base de datos.
    Retorna una lista de entidades detectadas para que el frontend las resalte.
    """
    if not text:
        return []

    # Obtenemos todos los alias junto con su información del Codex
    aliases = db.query(CodexAlias).join(CodexEntry).all()
    
    detected_entities = {}
    
    for alias in aliases:
        # re.escape previene errores si el alias tiene caracteres especiales regex
        # \b asegura límites de palabra (no detecta "Rey" dentro de "Reyerta")
        pattern = r'\b' + re.escape(alias.alias_name) + r'\b'
        
        # re.IGNORECASE para coincidir con mayúsculas y minúsculas indistintamente
        matches = list(re.finditer(pattern, text, flags=re.IGNORECASE))
        
        if matches:
            entry_id = alias.entry.id
            if entry_id not in detected_entities:
                detected_entities[entry_id] = {
                    "codex_entry_id": entry_id,
                    "name": alias.entry.name,
                    "category": alias.entry.category.value,
                    "matched_aliases": set(),
                    "mentions_count": 0
                }
            
            detected_entities[entry_id]["matched_aliases"].add(alias.alias_name)
            detected_entities[entry_id]["mentions_count"] += len(matches)

    # Convertimos los sets a listas antes de enviar la respuesta (para que sea serializable por FastAPI)
    result = []
    for data in detected_entities.values():
        data["matched_aliases"] = list(data["matched_aliases"])
        result.append(data)
        
    return result
