import requests

# This is a bit hard without a token. Let's do it using db directly.
from app.db.database import SessionLocal
from app.models.codex import CodexEntry

db = SessionLocal()
entries = db.query(CodexEntry).all()
for e in entries:
    print(e.name, e.aliases)
