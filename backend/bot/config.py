from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class BotSettings(BaseSettings):
    bot_token: str = Field(default="", alias="BOT_TOKEN")
    backend_api_url: str = Field(default="http://127.0.0.1:8080", alias="BACKEND_API_URL")
    admin_telegram_ids_raw: str = Field(default="", alias="ADMIN_TELEGRAM_IDS")

    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    @property
    def backend_url(self) -> str:
        return self.backend_api_url.rstrip("/")

    @property
    def admin_telegram_ids(self) -> list[int]:
        ids: list[int] = []
        for raw_id in self.admin_telegram_ids_raw.split(","):
            raw_id = raw_id.strip()
            if raw_id.isdigit():
                ids.append(int(raw_id))
        return ids


@lru_cache
def get_bot_settings() -> BotSettings:
    return BotSettings()


settings = get_bot_settings()
