import asyncio
from app.db.database import SessionLocal
from app.models.settings import GlobalSettings
import httpx

async def main():
    db = SessionLocal()
    groq_key = db.query(GlobalSettings).filter(GlobalSettings.key == "global_groq_key").first()
    db.close()
    if not groq_key:
        print("No Groq Key found")
        return
        
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {groq_key.value}"}
        )
        print(response.status_code)
        print([m["id"] for m in response.json().get("data", [])])

if __name__ == "__main__":
    asyncio.run(main())
