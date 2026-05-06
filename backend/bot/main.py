import asyncio
import logging

from aiogram import Bot, Dispatcher

from bot.config import settings
from bot.handlers import setup_routers


async def main() -> None:
    if not settings.bot_token or settings.bot_token == "your_bot_token_here":
        raise RuntimeError("BOT_TOKEN is not configured. Add BOT_TOKEN to backend/.env")

    logging.basicConfig(level=logging.INFO)
    bot = Bot(token=settings.bot_token)
    dispatcher = Dispatcher()
    dispatcher.include_router(setup_routers())
    await dispatcher.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
