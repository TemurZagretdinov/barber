from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram.types import InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

from bot.api_client import AvailableSlot, Barber, BarberService


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.button(text="✂️ Barber tanlash")
    builder.button(text="📋 Mening bookingim")
    builder.button(text="ℹ️ Yordam")
    builder.button(text="💼 Barber panel")
    builder.adjust(1)
    return builder.as_markup(resize_keyboard=True)


def phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📞 Telefon raqamni yuborish", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def location_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="📍 Lokatsiyani yuborish", request_location=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def barber_sort_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="📍 Eng yaqin", callback_data="barber_sort:nearest")
    builder.button(text="💸 Eng arzon", callback_data="barber_sort:cheapest")
    builder.button(text="💎 Eng qimmat", callback_data="barber_sort:expensive")
    builder.adjust(1)
    return builder.as_markup()


def barbers_keyboard(barbers: list[Barber]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for barber in barbers:
        barber_id = barber.get("id")
        if barber_id is None:
            continue
        name = barber.get("full_name") or barber.get("name") or "Noma'lum barber"
        rating = barber.get("average_rating") or barber.get("rating") or 0
        try:
            rating_value = float(rating)
        except (TypeError, ValueError):
            rating_value = 0.0
        suffix = f"⭐ {rating_value:.1f}"
        if barber.get("distance_km") is not None:
            suffix = f"📍 {barber['distance_km']} km"
        elif barber.get("price_from") is not None:
            suffix = f"💸 {barber['price_from']} UZS"
        builder.button(text=f"{name} {suffix}", callback_data=f"barber:{barber_id}")
        continue
        builder.button(text=f"{name} ⭐ {rating_value:.1f}", callback_data=f"barber:{barber_id}")
    builder.adjust(1)
    return builder.as_markup()


def dates_keyboard(days: int = 5) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    today = datetime.now(ZoneInfo("Asia/Tashkent")).date()
    for offset in range(days):
        current = today + timedelta(days=offset)
        if offset == 0:
            label = "Bugun"
        elif offset == 1:
            label = "Ertaga"
        else:
            label = current.strftime("%Y-%m-%d")
        builder.button(text=label, callback_data=f"date:{current.isoformat()}")
    builder.adjust(2)
    return builder.as_markup()


def slots_keyboard(slots: list[AvailableSlot]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for slot in slots:
        if slot.get("is_available"):
            slot_time = str(slot.get("time"))
            builder.button(text=slot_time, callback_data=f"time:{slot_time}")
    builder.adjust(2)
    return builder.as_markup()


def services_keyboard(services: list[BarberService]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for service in services:
        service_id = service.get("id")
        if service_id is None:
            continue
        name = service.get("name") or "Xizmat"
        price = service.get("price")
        duration = service.get("duration_minutes")
        suffix = f"{int(price):,} UZS".replace(",", " ") if isinstance(price, (int, float)) else ""
        if duration:
            suffix = f"{suffix} - {duration} min" if suffix else f"{duration} min"
        builder.button(text=f"{name} {suffix}".strip(), callback_data=f"service:{service_id}")
    builder.adjust(1)
    return builder.as_markup()


def confirmation_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Tasdiqlash", callback_data="booking:confirm")
    builder.button(text="❌ Bekor qilish", callback_data="booking:cancel")
    builder.adjust(2)
    return builder.as_markup()


def barber_panel_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="Bugungi bookinglar", callback_data="barber_panel:today")
    builder.adjust(1)
    return builder.as_markup()


def barber_booking_actions_keyboard(booking_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Completed", callback_data=f"barber_action:complete:{booking_id}")
    builder.button(text="🚫 No-show", callback_data=f"barber_action:no_show:{booking_id}")
    builder.adjust(2)
    return builder.as_markup()
