from aiogram import Router

from bot.handlers import booking, start


def setup_routers() -> Router:
    router = Router()
    router.include_router(start.router)
    router.include_router(booking.router)
    return router
