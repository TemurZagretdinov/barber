from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BarberBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=140)
    specialty: str = Field(min_length=2, max_length=180)
    barbershop_name: str | None = Field(default=None, max_length=180)
    photo_url: str = Field(min_length=1, max_length=500)
    phone: str | None = Field(default=None, max_length=40)
    rating: float = Field(ge=1, le=5)
    years_experience: int = Field(ge=0, le=60)
    price_from: float | None = Field(default=None, ge=0)
    base_price: float | None = Field(default=None, ge=0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    address: str | None = Field(default=None, max_length=255)
    work_start_time: time | None = None
    work_end_time: time | None = None
    off_days: list[str] = Field(default_factory=list)
    bio: str | None = None

    @field_validator("work_end_time")
    @classmethod
    def validate_work_time(cls, value: time | None, info):
        start = info.data.get("work_start_time")
        if value is not None and start is not None and start >= value:
            raise ValueError("work_start_time must be earlier than work_end_time")
        return value


class BarberCreate(BarberBase):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=4, max_length=128)


class BarberUpdate(BarberBase):
    email: str = Field(min_length=5, max_length=120)
    password: str | None = Field(default=None, min_length=4, max_length=128)
    is_active: bool = True

    @field_validator("password")
    @classmethod
    def empty_password_to_none(cls, value: str | None) -> str | None:
        if value == "":
            return None
        return value


class BarberRead(BarberBase):
    id: int
    user_id: int
    email: str
    is_active: bool
    is_financially_blocked: bool = False
    created_at: datetime
    updated_at: datetime
    distance_km: float | None = None
    experience_years: int = 0

    model_config = ConfigDict(from_attributes=True)


class BarberAdminRead(BarberRead):
    total_bookings: int = 0
    today_bookings: int = 0
    balance: int = 0
    debt: int = 0
    commission_percent: int = 10


class AvailableSlot(BaseModel):
    time: str
    is_available: bool
    is_booked: bool = False
    is_expired: bool = False
    available: bool | None = None
    reason: str | None = None


class AvailableSlotsResponse(BaseModel):
    date: date
    barber_id: int
    service_id: int | None = None
    duration_minutes: int
    slots: list[AvailableSlot]


class BarberServiceBase(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1000)
    price: float = Field(ge=0)
    duration_minutes: int = Field(ge=10, le=480)
    is_active: bool = True


class BarberServiceCreate(BarberServiceBase):
    pass


class BarberServiceUpdate(BarberServiceBase):
    pass


class BarberServiceRead(BarberServiceBase):
    id: int
    barber_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BarberScheduleItem(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    break_start_time: time | None = None
    break_end_time: time | None = None
    is_working: bool = True

    @field_validator("end_time")
    @classmethod
    def validate_end_time(cls, value: time, info):
        start = info.data.get("start_time")
        if start is not None and start >= value:
            raise ValueError("start_time must be earlier than end_time")
        return value

    @field_validator("break_end_time")
    @classmethod
    def validate_break_time(cls, value: time | None, info):
        start = info.data.get("break_start_time")
        if value is not None and start is not None and start >= value:
            raise ValueError("break_start_time must be earlier than break_end_time")
        return value


class BarberScheduleRead(BarberScheduleItem):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BarberDayOffCreate(BaseModel):
    date: date
    reason: str | None = Field(default=None, max_length=255)


class BarberDayOffRead(BarberDayOffCreate):
    id: int
    barber_id: int

    model_config = ConfigDict(from_attributes=True)


class BarberVacationCreate(BaseModel):
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=255)

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, value: date, info):
        start = info.data.get("start_date")
        if start is not None and start > value:
            raise ValueError("start_date must be before or equal to end_date")
        return value


class BarberVacationRead(BarberVacationCreate):
    id: int
    barber_id: int

    model_config = ConfigDict(from_attributes=True)
