"""Application configuration — loaded from .env file."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    shopify_store_domain: str = ""
    shopify_storefront_access_token: str = ""
    shopify_admin_api_key: str = ""
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    max_requests_per_minute: int = 20
    max_tool_calls_per_turn: int = 5
    max_input_chars: int = 1000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
