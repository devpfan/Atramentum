import asyncio
from app.core.security import create_access_token
from app.db.database import SessionLocal
from app.models.user import User
import httpx

async def main():
    db = SessionLocal()
    user = db.query(User).first()
    db.close()
    token = create_access_token({"sub": str(user.email)})
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/ai/inline-edit",
            json={"selected_text": "hello", "instruction": "translate"},
            headers={"Authorization": f"Bearer {token}"}
        )
        print(response.status_code)
        print(response.text)

if __name__ == "__main__":
    asyncio.run(main())
