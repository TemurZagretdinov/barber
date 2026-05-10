from datetime import date
from hmac import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_barber, get_current_user, require_admin
from app.api.routes.barbers import serialize_barber
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import get_db
from app.models.barber import Barber
from app.models.booking import Booking
from app.models.user import User
from app.models.working_hour import WorkingHour
from app.schemas.barber import BarberAdminRead, BarberCreate, BarberRead, BarberUpdate
from app.schemas.booking import BookingStatusUpdate, BookingWithBarber
from app.schemas.dashboard import AdminDashboard, AdminDashboardV2
from app.schemas.finance import (
    AdminBalanceAdjustmentRequest,
    AdminBarberFinanceRead,
    AdminDemoBarberFinanceRead,
    AdminDemoFinanceOverview,
    AdminFinanceOverview,
    DailySettlementRunRequest,
    DailySettlementRunResponse,
    DemoDailySettlementRunResponse,
)
from app.services.booking_service import (
    booking_to_with_barber,
    complete_booking_for_barber,
    query_bookings,
    tashkent_now,
    update_booking_status,
)
from app.services.dashboard_service import get_admin_dashboard, get_admin_dashboard_v2
from app.services.demo_seed_service import seed_demo_data
from app.services.finance_service import (
    adjust_barber_balance,
    adjust_demo_barber_balance,
    get_admin_demo_barber_finance,
    get_admin_demo_finance_overview,
    get_admin_barber_finance,
    get_admin_finance_overview,
    run_demo_daily_settlement,
    run_daily_settlement,
)

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboard, dependencies=[Depends(require_admin)])
def dashboard(db: Session = Depends(get_db)) -> AdminDashboard:
    return get_admin_dashboard(db)


@router.get("/admin/dashboard", response_model=AdminDashboardV2, dependencies=[Depends(require_admin)])
def dashboard_v2(db: Session = Depends(get_db)) -> AdminDashboardV2:
    return get_admin_dashboard_v2(db)


WEEKDAYS = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")


def validate_seed_secret(x_seed_secret: str | None) -> None:
    if not settings.seed_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SEED_SECRET is not configured on the server.",
        )
    if not x_seed_secret or not compare_digest(x_seed_secret, settings.seed_secret):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid seed secret")


@router.post("/admin/seed-demo-data", include_in_schema=False)
@router.post("/seed-demo-data")
def seed_demo_data_endpoint(
    x_seed_secret: str | None = Header(default=None, alias="X-Seed-Secret"),
    db: Session = Depends(get_db),
) -> dict[str, int | str]:
    # Alpha/dev seeding endpoint for deployments where shell access is unavailable.
    # Keep SEED_SECRET private and remove/rotate it before production use.
    validate_seed_secret(x_seed_secret)
    try:
        result = seed_demo_data(db)
    except Exception:
        db.rollback()
        raise
    return {"status": "ok", **result}


def sync_barber_working_hours(db: Session, barber: Barber) -> None:
    if not barber.work_start_time or not barber.work_end_time:
        return
    off_days = set(barber.off_days or [])
    existing = {
        item.weekday: item
        for item in db.scalars(select(WorkingHour).where(WorkingHour.barber_id == barber.id)).all()
    }
    for weekday, weekday_name in enumerate(WEEKDAYS):
        row = existing.get(weekday)
        if row is None:
            row = WorkingHour(barber_id=barber.id, weekday=weekday, start_time=barber.work_start_time, end_time=barber.work_end_time)
            db.add(row)
        row.start_time = barber.work_start_time
        row.end_time = barber.work_end_time
        row.is_active = weekday_name not in off_days


def admin_barber_payload(db: Session, barber: Barber) -> BarberAdminRead:
    base = serialize_barber(barber).model_dump()
    today = tashkent_now().date()
    base["total_bookings"] = db.scalar(select(func.count(Booking.id)).where(Booking.barber_id == barber.id)) or 0
    base["today_bookings"] = (
        db.scalar(select(func.count(Booking.id)).where(Booking.barber_id == barber.id, Booking.booking_date == today))
        or 0
    )
    base["balance"] = barber.balance
    base["debt"] = barber.debt
    base["demo_balance"] = barber.demo_balance
    base["demo_debt"] = barber.demo_debt
    base["commission_percent"] = barber.commission_percent
    return BarberAdminRead(**base)


@router.get("/barbers", response_model=list[BarberAdminRead], dependencies=[Depends(require_admin)])
def list_barbers(db: Session = Depends(get_db)) -> list[BarberAdminRead]:
    barbers = db.scalars(select(Barber).options(selectinload(Barber.user)).order_by(Barber.full_name)).all()
    return [admin_barber_payload(db, barber) for barber in barbers]


@router.post("/barbers", response_model=BarberRead, status_code=201, dependencies=[Depends(require_admin)])
def create_barber(payload: BarberCreate, db: Session = Depends(get_db)) -> BarberRead:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    user = User(email=payload.email, password_hash=get_password_hash(payload.password), role="barber", is_active=True)
    db.add(user)
    db.flush()
    barber = Barber(
        user_id=user.id,
        full_name=payload.full_name,
        specialty=payload.specialty,
        barbershop_name=payload.barbershop_name,
        photo_url=payload.photo_url,
        phone=payload.phone,
        rating=payload.rating,
        years_experience=payload.years_experience,
        price_from=payload.price_from if payload.price_from is not None else payload.base_price,
        base_price=payload.base_price if payload.base_price is not None else payload.price_from,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        work_start_time=payload.work_start_time,
        work_end_time=payload.work_end_time,
        off_days=payload.off_days,
        bio=payload.bio,
        commission_percent=settings.commission_percent_default,
    )
    db.add(barber)
    db.flush()
    sync_barber_working_hours(db, barber)
    db.commit()
    db.refresh(barber)
    barber.user = user
    return serialize_barber(barber)


@router.patch("/barbers/{barber_id}", response_model=BarberRead, dependencies=[Depends(require_admin)])
def update_barber(barber_id: int, payload: BarberUpdate, db: Session = Depends(get_db)) -> BarberRead:
    barber = db.scalar(select(Barber).options(selectinload(Barber.user)).where(Barber.id == barber_id))
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    email_owner = db.scalar(select(User).where(User.email == payload.email, User.id != barber.user_id))
    if email_owner:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    barber.user.email = payload.email
    if payload.password:
        barber.user.password_hash = get_password_hash(payload.password)
    barber.full_name = payload.full_name
    barber.specialty = payload.specialty
    barber.barbershop_name = payload.barbershop_name
    barber.photo_url = payload.photo_url
    barber.phone = payload.phone
    barber.rating = payload.rating
    barber.years_experience = payload.years_experience
    if "price_from" in payload.model_fields_set:
        barber.price_from = payload.price_from
    if "base_price" in payload.model_fields_set:
        barber.base_price = payload.base_price
    if barber.price_from is None and barber.base_price is not None:
        barber.price_from = barber.base_price
    if barber.base_price is None and barber.price_from is not None:
        barber.base_price = barber.price_from
    if "latitude" in payload.model_fields_set:
        barber.latitude = payload.latitude
    if "longitude" in payload.model_fields_set:
        barber.longitude = payload.longitude
    if "address" in payload.model_fields_set:
        barber.address = payload.address
    barber.work_start_time = payload.work_start_time
    barber.work_end_time = payload.work_end_time
    barber.off_days = payload.off_days
    barber.bio = payload.bio
    barber.is_active = payload.is_active
    barber.user.is_active = payload.is_active
    sync_barber_working_hours(db, barber)
    db.commit()
    db.refresh(barber)
    return serialize_barber(barber)


@router.delete("/barbers/{barber_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_barber(barber_id: int, db: Session = Depends(get_db)) -> Response:
    barber = db.get(Barber, barber_id)
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")
    barber.is_active = False
    if barber.user:
        barber.user.is_active = False
    db.commit()
    return Response(status_code=204)


@router.get("/bookings", response_model=list[BookingWithBarber], dependencies=[Depends(require_admin)])
def list_bookings(
    date: date | None = None,
    status: str | None = None,
    barber_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[BookingWithBarber]:
    bookings = query_bookings(db, booking_date=date, status_filter=status, barber_id=barber_id, search=search)
    return [booking_to_with_barber(item) for item in bookings]


@router.patch("/bookings/{booking_id}/status", response_model=BookingWithBarber)
def patch_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    barber_id = None
    if current_user.role == "barber":
        barber_id = get_current_barber(current_user=current_user, db=db).id
        if payload.status == "completed":
            booking = complete_booking_for_barber(db, booking_id, barber_id)
            return booking_to_with_barber(booking)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    if current_user.role == "admin" and payload.status == "completed":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin cannot complete bookings")
    booking = update_booking_status(db, booking_id, payload.status, barber_id=barber_id)
    return booking_to_with_barber(booking)


@router.get("/admin/finance/overview", response_model=AdminFinanceOverview, dependencies=[Depends(require_admin)])
def finance_overview(db: Session = Depends(get_db)) -> AdminFinanceOverview:
    return get_admin_finance_overview(db)


@router.get("/admin/barbers/{barber_id}/finance", response_model=AdminBarberFinanceRead, dependencies=[Depends(require_admin)])
def barber_finance(barber_id: int, db: Session = Depends(get_db)) -> AdminBarberFinanceRead:
    return get_admin_barber_finance(db, barber_id)


@router.post("/admin/settlements/run", response_model=DailySettlementRunResponse, dependencies=[Depends(require_admin)])
def run_settlements(payload: DailySettlementRunRequest, db: Session = Depends(get_db)) -> DailySettlementRunResponse:
    return run_daily_settlement(db, payload.date)


@router.post("/admin/barbers/{barber_id}/adjust-balance", response_model=AdminBarberFinanceRead, dependencies=[Depends(require_admin)])
def adjust_balance(
    barber_id: int,
    payload: AdminBalanceAdjustmentRequest,
    db: Session = Depends(get_db),
) -> AdminBarberFinanceRead:
    return adjust_barber_balance(db, barber_id, payload.amount, payload.description)


@router.get("/admin/demo-finance/overview", response_model=AdminDemoFinanceOverview, dependencies=[Depends(require_admin)])
def demo_finance_overview(db: Session = Depends(get_db)) -> AdminDemoFinanceOverview:
    return get_admin_demo_finance_overview(db)


@router.get(
    "/admin/barbers/{barber_id}/demo-finance",
    response_model=AdminDemoBarberFinanceRead,
    dependencies=[Depends(require_admin)],
)
def barber_demo_finance(barber_id: int, db: Session = Depends(get_db)) -> AdminDemoBarberFinanceRead:
    return get_admin_demo_barber_finance(db, barber_id)


@router.post(
    "/admin/demo-settlements/run",
    response_model=DemoDailySettlementRunResponse,
    dependencies=[Depends(require_admin)],
)
def run_demo_settlements(
    payload: DailySettlementRunRequest,
    db: Session = Depends(get_db),
) -> DemoDailySettlementRunResponse:
    return run_demo_daily_settlement(db, payload.date)


@router.post(
    "/admin/barbers/{barber_id}/demo-balance/adjust",
    response_model=AdminDemoBarberFinanceRead,
    dependencies=[Depends(require_admin)],
)
def adjust_demo_balance(
    barber_id: int,
    payload: AdminBalanceAdjustmentRequest,
    db: Session = Depends(get_db),
) -> AdminDemoBarberFinanceRead:
    return adjust_demo_barber_balance(db, barber_id, payload.amount, payload.description)
