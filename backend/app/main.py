import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, barber_panel, barbers, bookings, customer, notifications, telegram, users
from app.core.config import settings
from app.db.database import SessionLocal
from app.services.notification_service import send_due_reminders

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
app.include_router(barbers.router, prefix="/public", tags=["public"])
app.include_router(bookings.router, prefix="/public", tags=["public"])
app.include_router(customer.router, tags=["customer"])
app.include_router(notifications.router, tags=["notifications"])
app.include_router(admin.router, tags=["admin"])
app.include_router(barber_panel.router, tags=["barber"])


async def reminder_loop() -> None:
    while True:
        await asyncio.sleep(60)
        db = SessionLocal()
        try:
            send_due_reminders(db)
        finally:
            db.close()


@app.on_event("startup")
async def start_reminder_loop() -> None:
    asyncio.create_task(reminder_loop())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
