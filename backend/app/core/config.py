from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Atramentum API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "atramentum"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Inteligencia Artificial (LLM)
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
