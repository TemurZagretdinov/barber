from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Barber Shop Booking API"
    PROJECT_VERSION: str = "1.0.0"

    database_url: str = Field(
        default="postgresql+psycopg://postgres:password@localhost:5432/barber_booking",
        alias="DATABASE_URL",
    )
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006",
        alias="CORS_ORIGINS",
    )
    admin_email: str = Field(default="admin@gmail.com", alias="ADMIN_EMAIL")
    admin_password: str = Field(default="admin123", alias="ADMIN_PASSWORD")
    admin_full_name: str = Field(default="Admin", alias="ADMIN_FULL_NAME")
    telegram_use_polling: bool = Field(default=False, alias="TELEGRAM_USE_POLLING")
    telegram_bot_token: str = Field(default="", alias="BOT_TOKEN")

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
