from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    PORT:               int    = 8000
    ENVIRONMENT:        str    = "development"
    INTERNAL_KEY:       str    = ""
    GROQ_API_KEY:       str    = ""
    GROQ_MODEL:         str    = "llama-3.3-70b-versatile"
    MONGODB_URI:        str    = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY:    str = ""
    CLOUDINARY_API_SECRET: str = ""
    EMBEDDING_MODEL:    str    = "all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"
        extra    = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()