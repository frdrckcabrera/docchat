"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings.

    Values are loaded from environment variables or a .env file.
    """

    # LLM Provider: "gemini" or "claude"
    llm_provider: str = "gemini"

    # API Keys (only set the one matching your provider)
    gemini_api_key: str = ""
    anthropic_api_key: str = ""

    # Model names
    gemini_model: str = "gemini-2.5-flash"
    claude_model: str = "claude-3-5-haiku-20241022"

    # Embedding model (runs locally, no API key needed)
    embedding_model: str = "all-MiniLM-L6-v2"

    # Database
    database_path: str = "/tmp/docchat.db"

    # Chunking
    chunk_size: int = 500
    chunk_overlap: int = 50

    # Retrieval
    top_k: int = 5

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
