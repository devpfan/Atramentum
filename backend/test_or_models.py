import asyncio
from app.db.database import SessionLocal
from app.models.settings import GlobalSettings
import httpx

async def main():
    db = SessionLocal()
    or_key = db.query(GlobalSettings).filter(GlobalSettings.key == "global_openrouter_key").first()
    db.close()
    if not or_key:
        print("No OR Key found")
        return
        
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {or_key.value}"}
        )
        print(response.status_code)
        print([m["id"] for m in response.json().get("data", [])])

if __name__ == "__main__":
    asyncio.run(main())
