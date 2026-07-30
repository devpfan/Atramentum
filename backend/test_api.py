from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db, SessionLocal
from app.api.deps import get_current_user
from app.models.user import User

def override_get_db():
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def override_get_current_user():
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)
response = client.get("/api/v1/codex/?book_id=1")
print(response.json())
