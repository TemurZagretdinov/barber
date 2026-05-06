from datetime import date, time

from pydantic import BaseModel

from app.schemas.booking import BookingWithBarber


class DashboardStats(BaseModel):
    total_bookings: int
    active_barbers: int
    completed: int
    pending: int
    today_bookings: int = 0


class BarberPerformance(BaseModel):
    barber_id: int
    full_name: str
    photo_url: str
    completed: int
    pending: int
    total: int


class AdminDashboard(BaseModel):
    stats: DashboardStats
    performance: list[BarberPerformance]
    recent_bookings: list[BookingWithBarber]


class BarberDashboard(BaseModel):
    barber_id: int
    full_name: str
    photo_url: str
    specialty: str
    today: int
    done: int
    pending: int
    appointments: list[BookingWithBarber]


class AdminTopBarber(BaseModel):
    id: int
    full_name: str
    bookings_count: int
    completed_count: int
    revenue: float


class AdminDashboardV2(BaseModel):
    total_barbers: int
    active_barbers: int
    today_bookings: int
    completed_bookings: int
    top_barbers: list[AdminTopBarber]


class BarberDashboardBooking(BaseModel):
    id: int
    code: str
    customer_name: str
    customer_phone: str
    date: date
    time: time
    status: str
    price: float | None = None
    service_note: str | None = None


class BarberDashboardV2(BaseModel):
    today_bookings: int
    pending_count: int
    completed_count: int
    cancelled_count: int
    no_show_count: int
    today_revenue: float
    week_revenue: float
    week_completed: int
    bookings: list[BarberDashboardBooking]
