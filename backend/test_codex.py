import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.schemas.codex import CodexEntryUpdate

data = {
    "name": "el bar",
    "description": "Un lugar",
    "attributes": {"edad": "60"},
    "aliases": ["taberna"]
}

try:
    update = CodexEntryUpdate(**data)
    print("Parsed output:", update.model_dump(exclude_unset=True))
except Exception as e:
    print("Error:", e)
