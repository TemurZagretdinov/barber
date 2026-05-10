from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_barber
from app.db.database import get_db
from app.models.barber import Barber
from app.models.barber_service import BarberService
from app.models.barber_time_off import BarberDayOff, BarberVacation
from app.models.working_hour import WorkingHour
from app.schemas.barber import (
    BarberDayOffCreate,
    BarberDayOffRead,
    BarberScheduleItem,
    BarberScheduleRead,
    BarberServiceCreate,
    BarberServiceRead,
    BarberServiceUpdate,
    BarberVacationCreate,
    BarberVacationRead,
)
from app.schemas.booking import BookingActionNote, BookingWithBarber
from app.schemas.dashboard import BarberDashboard, BarberDashboardV2
from app.schemas.finance import BarberBalanceRead, BarberTopUpRequest, BarberTransactionRead
from app.services.booking_service import (
    booking_to_with_barber,
    complete_booking_for_barber,
    query_bookings,
    update_barber_booking_action,
)
from app.services.dashboard_service import get_barber_dashboard, get_barber_dashboard_v2
from app.services.finance_service import get_barber_balance_summary, list_barber_transactions, top_up_barber_balance

router = APIRouter()


@router.get("/bookings/dashboard", response_model=BarberDashboard)
def dashboard(
    date: date | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberDashboard:
    return get_barber_dashboard(db, barber, date)


@router.get("/barber/dashboard", response_model=BarberDashboardV2)
def dashboard_v2(
    date: date | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberDashboardV2:
    return get_barber_dashboard_v2(db, barber, date)


@router.get("/barber/balance", response_model=BarberBalanceRead)
def barber_balance(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberBalanceRead:
    return get_barber_balance_summary(db, barber)


@router.get("/barber/transactions", response_model=list[BarberTransactionRead])
def barber_transactions(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list:
    return list_barber_transactions(db, barber.id)


@router.post("/barber/balance/top-up", response_model=BarberBalanceRead)
def barber_top_up(
    payload: BarberTopUpRequest,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberBalanceRead:
    return top_up_barber_balance(db, barber, payload.amount)


@router.get("/barber/services", response_model=list[BarberServiceRead])
def list_services(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[BarberService]:
    return list(
        db.scalars(select(BarberService).where(BarberService.barber_id == barber.id).order_by(BarberService.name)).all()
    )


@router.post("/barber/services", response_model=BarberServiceRead, status_code=201)
def create_service(
    payload: BarberServiceCreate,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberService:
    service = BarberService(barber_id=barber.id, **payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/barber/services/{service_id}", response_model=BarberServiceRead)
def update_service(
    service_id: int,
    payload: BarberServiceUpdate,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberService:
    service = db.scalar(select(BarberService).where(BarberService.id == service_id, BarberService.barber_id == barber.id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for key, value in payload.model_dump().items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/barber/services/{service_id}", status_code=204)
def delete_service(
    service_id: int,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> Response:
    service = db.scalar(select(BarberService).where(BarberService.id == service_id, BarberService.barber_id == barber.id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = False
    db.commit()
    return Response(status_code=204)


@router.get("/barber/schedule", response_model=list[BarberScheduleRead])
def get_schedule(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[WorkingHour]:
    existing = {
        item.weekday: item
        for item in db.scalars(select(WorkingHour).where(WorkingHour.barber_id == barber.id)).all()
    }
    for weekday in range(7):
        if weekday not in existing:
            row = WorkingHour(
                barber_id=barber.id,
                weekday=weekday,
                start_time=barber.work_start_time or time(9, 0),
                end_time=barber.work_end_time or time(18, 0),
                is_active=weekday != 6,
            )
            db.add(row)
            existing[weekday] = row
    db.commit()
    return [existing[index] for index in range(7)]


@router.put("/barber/schedule", response_model=list[BarberScheduleRead])
def put_schedule(
    payload: list[BarberScheduleItem],
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[WorkingHour]:
    if len({item.weekday for item in payload}) != len(payload):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate weekday")
    existing = {
        item.weekday: item
        for item in db.scalars(select(WorkingHour).where(WorkingHour.barber_id == barber.id)).all()
    }
    for item in payload:
        row = existing.get(item.weekday)
        if row is None:
            row = WorkingHour(barber_id=barber.id, weekday=item.weekday, start_time=item.start_time, end_time=item.end_time)
            db.add(row)
            existing[item.weekday] = row
        row.start_time = item.start_time
        row.end_time = item.end_time
        row.break_start_time = item.break_start_time
        row.break_end_time = item.break_end_time
        row.is_active = item.is_working
    db.commit()
    return [existing[index] for index in sorted(existing)]


@router.post("/barber/day-offs", response_model=BarberDayOffRead, status_code=201)
def add_day_off(
    payload: BarberDayOffCreate,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberDayOff:
    existing = db.scalar(select(BarberDayOff).where(BarberDayOff.barber_id == barber.id, BarberDayOff.date == payload.date))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Day off already exists")
    row = BarberDayOff(barber_id=barber.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/barber/day-offs", response_model=list[BarberDayOffRead])
def list_day_offs(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[BarberDayOff]:
    return list(
        db.scalars(select(BarberDayOff).where(BarberDayOff.barber_id == barber.id).order_by(BarberDayOff.date.desc())).all()
    )


@router.delete("/barber/day-offs/{day_off_id}", status_code=204)
def delete_day_off(
    day_off_id: int,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> Response:
    row = db.scalar(select(BarberDayOff).where(BarberDayOff.id == day_off_id, BarberDayOff.barber_id == barber.id))
    if not row:
        raise HTTPException(status_code=404, detail="Day off not found")
    db.delete(row)
    db.commit()
    return Response(status_code=204)


@router.post("/barber/vacations", response_model=BarberVacationRead, status_code=201)
def add_vacation(
    payload: BarberVacationCreate,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BarberVacation:
    row = BarberVacation(barber_id=barber.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/barber/vacations", response_model=list[BarberVacationRead])
def list_vacations(
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[BarberVacation]:
    return list(
        db.scalars(
            select(BarberVacation).where(BarberVacation.barber_id == barber.id).order_by(BarberVacation.start_date.desc())
        ).all()
    )


@router.delete("/barber/vacations/{vacation_id}", status_code=204)
def delete_vacation(
    vacation_id: int,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> Response:
    row = db.scalar(select(BarberVacation).where(BarberVacation.id == vacation_id, BarberVacation.barber_id == barber.id))
    if not row:
        raise HTTPException(status_code=404, detail="Vacation not found")
    db.delete(row)
    db.commit()
    return Response(status_code=204)


@router.get("/bookings/me", response_model=list[BookingWithBarber])
def schedule(
    date: date | None = None,
    status: str | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[BookingWithBarber]:
    bookings = query_bookings(db, booking_date=date, status_filter=status, current_barber_id=barber.id)
    return [booking_to_with_barber(item) for item in bookings]


@router.get("/barber/bookings", response_model=list[BookingWithBarber])
def barber_bookings(
    date: date | None = None,
    status: str | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> list[BookingWithBarber]:
    bookings = query_bookings(db, booking_date=date, status_filter=status, current_barber_id=barber.id)
    return [booking_to_with_barber(item) for item in bookings]


@router.patch("/barber/bookings/{booking_id}/complete", response_model=BookingWithBarber)
def complete_booking(
    booking_id: int,
    payload: BookingActionNote | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    booking = complete_booking_for_barber(db, booking_id, barber.id, payload.note if payload else None)
    return booking_to_with_barber(booking)


@router.patch("/barber/bookings/{booking_id}/no-show", response_model=BookingWithBarber)
def no_show_booking(
    booking_id: int,
    payload: BookingActionNote | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    booking = update_barber_booking_action(db, booking_id, barber.id, "no_show", payload.note if payload else None)
    return booking_to_with_barber(booking)


@router.patch("/barber/bookings/{booking_id}/cancel", response_model=BookingWithBarber)
def cancel_booking(
    booking_id: int,
    payload: BookingActionNote | None = None,
    barber: Barber = Depends(get_current_barber),
    db: Session = Depends(get_db),
) -> BookingWithBarber:
    booking = update_barber_booking_action(db, booking_id, barber.id, "cancelled", payload.note if payload else None)
    return booking_to_with_barber(booking)
