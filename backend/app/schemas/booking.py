from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator


VALID_STATUSES = {"pending", "completed", "cancelled", "no_show"}


class BookingCreate(BaseModel):
    client_name: str = Field(min_length=2, max_length=140)
    client_phone: str = Field(min_length=5, max_length=40)
    barber_id: int
    service_id: int
    booking_date: date = Field(alias="appointment_date")
    booking_time: time = Field(alias="appointment_time")
    notes: str | None = None
    telegram_user_id: int | None = None
    customer_id: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class BookingStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in VALID_STATUSES:
            raise ValueError("status must be pending, completed, cancelled, or no_show")
        return value


class BookingActionNote(BaseModel):
    note: str | None = Field(default=None, max_length=1000)


class BookingReschedule(BaseModel):
    appointment_date: date
    appointment_time: time


class BookingClaim(BaseModel):
    booking_code: str


class BookingRead(BaseModel):
    id: int
    booking_code: str
    client_name: str
    client_phone: str
    barber_id: int
    service_id: int | None = None
    customer_id: int | None = None
    booking_date: date
    booking_time: time
    status: str
    price: float | None = None
    service_price: int = 0
    commission_percent: int = 0
    commission_amount: int = 0
    barber_earning: int = 0
    commission_charged: bool = False
    commission_charged_at: datetime | None = None
    duration_minutes: int
    notes: str | None = None
    service_note: str | None = None
    completed_at: datetime | None = None
    reminder_sent_at: datetime | None = None
    telegram_user_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingWithBarber(BookingRead):
    barber_name: str
    barber_photo_url: str | None = None
    barber_specialty: str | None = None
    barber_address: str | None = None
    barbershop_name: str | None = None
    service_name: str | None = None


class BookingReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1500)


class BookingReviewRead(BookingReviewCreate):
    id: int
    booking_id: int
    customer_id: int
    barber_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
