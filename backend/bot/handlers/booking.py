from datetime import datetime
from zoneinfo import ZoneInfo

from aiogram import Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message, ReplyKeyboardRemove

from bot.api_client import ApiClientError, BackendApiClient, Barber, Booking
from bot.config import settings
from bot.keyboards import (
    barber_booking_actions_keyboard,
    barber_panel_keyboard,
    barber_sort_keyboard,
    barbers_keyboard,
    confirmation_keyboard,
    dates_keyboard,
    location_keyboard,
    main_menu_keyboard,
    phone_keyboard,
    services_keyboard,
    slots_keyboard,
)
from bot.states import BarberPanelState, BookingLookupState, BookingState

router = Router()
api = BackendApiClient()


def _rating(barber: Barber) -> float:
    rating = barber.get("average_rating") or barber.get("rating") or 0
    try:
        return float(rating)
    except (TypeError, ValueError):
        return 0.0


def _barber_details(barber: Barber) -> str:
    name = barber.get("full_name") or barber.get("name") or "Noma'lum barber"
    specialty = barber.get("specialty") or "Barber"
    lines = [
        f"✂️ {name}",
        f"💈 {specialty}",
        f"⭐ {_rating(barber):.1f}",
    ]
    if barber.get("location_text"):
        lines.append(f"📍 {barber['location_text']}")
    if barber.get("address"):
        lines.append(f"📍 {barber['address']}")
    if barber.get("distance_km") is not None:
        lines.append(f"📏 {barber['distance_km']} km")
    if barber.get("price_from") is not None:
        lines.append(f"💸 {barber['price_from']} UZS")
    services = barber.get("services") or []
    if services:
        lines.append("🧾 " + ", ".join(services[:5]))
    return "\n".join(lines)


async def _send_barber_list(message: Message, barbers: list[Barber]) -> None:
    selectable_barbers = [barber for barber in barbers if barber.get("id") is not None]
    if not selectable_barbers:
        await message.answer("Hozircha barberlar mavjud emas", reply_markup=main_menu_keyboard())
        return

    await message.answer("Barber tanlang:", reply_markup=barbers_keyboard(selectable_barbers))


def _normalize_phone(raw_phone: str) -> str | None:
    phone = raw_phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 9:
        return None
    if phone.startswith("+998"):
        return phone
    if digits.startswith("998"):
        return f"+{digits}"
    return phone if phone.startswith("+") else f"+{digits}"


def _booking_summary(data: dict) -> str:
    barber = data.get("barber", {})
    service = data.get("service", {})
    return (
        "Booking ma’lumotlari:\n"
        f"✂️ Barber: {barber.get('full_name', 'Barber')}\n"
        f"Xizmat: {service.get('name', '-')}\n"
        f"📅 Sana: {data.get('date')}\n"
        f"⏰ Vaqt: {data.get('time')}\n"
        f"👤 Ism: {data.get('client_name')}\n"
        f"📞 Telefon: {data.get('client_phone')}\n\n"
        "Tasdiqlaysizmi?"
    )


def _booking_result_text(booking: Booking, data: dict) -> str:
    code = booking.get("booking_code") or booking.get("id") or "-"
    return (
        "✅ Booking muvaffaqiyatli yaratildi!\n"
        f"📌 Booking code: {code}\n"
        f"📅 Sana: {booking.get('booking_date') or data.get('date')}\n"
        f"⏰ Vaqt: {booking.get('booking_time') or data.get('time')}\n\n"
        "Tez orada sizni kutamiz ✂️"
    )


async def _notify_admins(booking: Booking, data: dict, event: CallbackQuery) -> None:
    if not settings.admin_telegram_ids:
        return
    barber = data.get("barber", {})
    code = booking.get("booking_code") or booking.get("id") or "-"
    text = (
        "🆕 Yangi booking!\n"
        f"👤 Client: {data.get('client_name')}\n"
        f"📞 Phone: {data.get('client_phone')}\n"
        f"✂️ Barber: {barber.get('full_name', 'Barber')}\n"
        f"📅 Date: {booking.get('booking_date') or data.get('date')}\n"
        f"⏰ Time: {booking.get('booking_time') or data.get('time')}\n"
        f"📌 Code: {code}"
    )
    for admin_id in settings.admin_telegram_ids:
        try:
            await event.bot.send_message(admin_id, text)
        except Exception:
            continue


@router.message(lambda message: message.text == "✂️ Barber tanlash")
async def choose_barber(message: Message, state: FSMContext) -> None:
    await state.set_state(BookingState.selecting_barber)
    await message.answer("Barberlarni qanday saralaymiz?", reply_markup=barber_sort_keyboard())
    return
    try:
        barbers = await api.get_barbers()
    except ApiClientError as exc:
        print("BARBER FETCH ERROR:", repr(exc))
        await message.answer("Server bilan bog‘lanishda muammo bor. Keyinroq urinib ko‘ring.", reply_markup=main_menu_keyboard())
        return

    selectable_barbers = [barber for barber in barbers if barber.get("id") is not None]
    if not selectable_barbers:
        await message.answer("Hozircha barberlar mavjud emas", reply_markup=main_menu_keyboard())
        return

    await message.answer("Barber tanlang:", reply_markup=barbers_keyboard(selectable_barbers))


@router.callback_query(lambda callback: callback.data and callback.data.startswith("barber_sort:"))
async def barber_sort_selected(callback: CallbackQuery, state: FSMContext) -> None:
    sort = str(callback.data).split(":", 1)[1]
    await state.update_data(barber_sort=sort)
    if sort == "nearest":
        await state.set_state(BookingState.waiting_location)
        await callback.message.answer("Eng yaqin barberlarni ko'rsatish uchun lokatsiyangizni yuboring.", reply_markup=location_keyboard())
        await callback.answer()
        return

    await state.set_state(BookingState.selecting_barber)
    try:
        barbers = await api.get_barbers(sort=sort)
    except ApiClientError as exc:
        print("BARBER FETCH ERROR:", repr(exc))
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return

    await _send_barber_list(callback.message, barbers)
    await callback.answer()


@router.message(BookingState.waiting_location)
async def location_received(message: Message, state: FSMContext) -> None:
    if not message.location:
        await message.answer("Lokatsiya yuborilmadi. Pastdagi tugma orqali lokatsiyani yuboring.", reply_markup=location_keyboard())
        return

    try:
        barbers = await api.get_barbers(
            sort="nearest",
            user_lat=message.location.latitude,
            user_lng=message.location.longitude,
        )
    except ApiClientError as exc:
        await message.answer(str(exc), reply_markup=main_menu_keyboard())
        return

    await state.set_state(BookingState.selecting_barber)
    await message.answer("Lokatsiya qabul qilindi.", reply_markup=ReplyKeyboardRemove())
    await _send_barber_list(message, barbers)


@router.callback_query(lambda callback: callback.data and callback.data.startswith("barber:"))
async def barber_selected(callback: CallbackQuery, state: FSMContext) -> None:
    try:
        barber_id = int(str(callback.data).split(":", 1)[1])
    except (IndexError, ValueError):
        await callback.answer("Noto‘g‘ri barber tanlandi.", show_alert=True)
        return
    try:
        barber = await api.get_barber(barber_id)
    except ApiClientError as exc:
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return

    await state.update_data(barber_id=barber_id, barber=barber)
    await state.set_state(BookingState.selecting_service)
    await callback.message.answer(_barber_details(barber))
    try:
        services = await api.get_services(barber_id)
    except ApiClientError as exc:
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return
    if not services:
        await callback.message.answer("Bu barberda hozircha aktiv xizmatlar yo'q.", reply_markup=main_menu_keyboard())
        await callback.answer()
        return
    await state.update_data(services=services)
    await callback.message.answer("Xizmat tanlang:", reply_markup=services_keyboard(services))
    await callback.answer()


@router.callback_query(lambda callback: callback.data and callback.data.startswith("service:"))
async def service_selected(callback: CallbackQuery, state: FSMContext) -> None:
    try:
        service_id = int(str(callback.data).split(":", 1)[1])
    except (IndexError, ValueError):
        await callback.answer("Noto'g'ri xizmat tanlandi.", show_alert=True)
        return
    data = await state.get_data()
    services = data.get("services") or []
    service = next((item for item in services if int(item.get("id", 0)) == service_id), None)
    if not service:
        await callback.answer("Xizmat topilmadi.", show_alert=True)
        return
    await state.update_data(service_id=service_id, service=service)
    await state.set_state(BookingState.selecting_date)
    await callback.message.answer("Sana tanlang:", reply_markup=dates_keyboard())
    await callback.answer()


@router.callback_query(lambda callback: callback.data and callback.data.startswith("date:"))
async def date_selected(callback: CallbackQuery, state: FSMContext) -> None:
    booking_date = str(callback.data).split(":", 1)[1]
    data = await state.get_data()
    barber_id = int(data["barber_id"])
    service_id = int(data["service_id"])

    try:
        slots = await api.get_service_availability(barber_id, service_id, booking_date)
    except ApiClientError as exc:
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return

    await state.update_data(date=booking_date)
    await state.set_state(BookingState.selecting_time)
    available_slots = [slot for slot in slots if slot.get("is_available")]
    if not available_slots:
        await callback.message.answer("Bu kunda bo‘sh vaqt yo‘q. Boshqa sana tanlang.", reply_markup=dates_keyboard())
        await callback.answer()
        return

    await callback.message.answer("Bo‘sh vaqtni tanlang:", reply_markup=slots_keyboard(available_slots))
    await callback.answer()


@router.callback_query(lambda callback: callback.data and callback.data.startswith("time:"))
async def time_selected(callback: CallbackQuery, state: FSMContext) -> None:
    booking_time = str(callback.data).split(":", 1)[1]
    await state.update_data(time=booking_time)
    await state.set_state(BookingState.entering_name)
    await callback.message.answer("Ismingizni kiriting:")
    await callback.answer()


@router.message(BookingState.entering_name)
async def name_entered(message: Message, state: FSMContext) -> None:
    name = (message.text or "").strip()
    if len(name) < 2:
        await message.answer("Ism kamida 2 ta belgidan iborat bo‘lsin.")
        return

    await state.update_data(client_name=name)
    await state.set_state(BookingState.entering_phone)
    await message.answer("Telefon raqamingizni yuboring yoki pastdagi buttonni bosing.", reply_markup=phone_keyboard())


@router.message(BookingState.entering_phone)
async def phone_entered(message: Message, state: FSMContext) -> None:
    if message.contact and message.contact.phone_number:
        phone = _normalize_phone(message.contact.phone_number)
    else:
        phone = _normalize_phone(message.text or "")

    if not phone:
        await message.answer("Telefon raqam noto‘g‘ri. Masalan: +998901234567")
        return

    await state.update_data(client_phone=phone)
    await state.set_state(BookingState.confirming)
    data = await state.get_data()
    await message.answer("Telefon raqam qabul qilindi.", reply_markup=ReplyKeyboardRemove())
    await message.answer(_booking_summary(data), reply_markup=confirmation_keyboard())


@router.callback_query(lambda callback: callback.data == "booking:cancel")
async def cancel_booking(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.answer("Booking bekor qilindi.", reply_markup=main_menu_keyboard())
    await callback.answer()


@router.callback_query(lambda callback: callback.data == "booking:confirm")
async def confirm_booking(callback: CallbackQuery, state: FSMContext) -> None:
    data = await state.get_data()
    try:
        booking = await api.create_booking(
            barber_id=int(data["barber_id"]),
            service_id=int(data["service_id"]),
            client_name=str(data["client_name"]),
            client_phone=str(data["client_phone"]),
            appointment_date=str(data["date"]),
            appointment_time=str(data["time"]),
            telegram_user_id=callback.from_user.id,
        )
    except ApiClientError as exc:
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return

    await _notify_admins(booking, data, callback)
    await state.clear()
    await callback.message.answer(_booking_result_text(booking, data), reply_markup=main_menu_keyboard())
    await callback.answer()


@router.message(lambda message: message.text == "📋 Mening bookingim")
async def ask_booking_code(message: Message, state: FSMContext) -> None:
    await state.set_state(BookingLookupState.entering_code)
    await message.answer("Booking code kiriting:", reply_markup=ReplyKeyboardRemove())


@router.message(BookingLookupState.entering_code)
async def booking_code_entered(message: Message, state: FSMContext) -> None:
    code = (message.text or "").strip()
    if not code:
        await message.answer("Booking code kiriting.")
        return

    try:
        booking = await api.get_booking(code)
        barber = await api.get_barber(int(booking["barber_id"]))
    except ApiClientError as exc:
        await message.answer(str(exc), reply_markup=main_menu_keyboard())
        await state.clear()
        return

    await state.clear()
    await message.answer(
        "📋 Booking ma’lumotlari:\n"
        f"📌 Code: {booking.get('booking_code') or booking.get('id')}\n"
        f"✂️ Barber: {barber.get('full_name', 'Barber')}\n"
        f"📅 Sana: {booking.get('booking_date')}\n"
        f"⏰ Vaqt: {booking.get('booking_time')}\n"
        f"👤 Ism: {booking.get('client_name')}\n"
        f"📞 Telefon: {booking.get('client_phone')}\n"
        f"📍 Status: {booking.get('status')}",
        reply_markup=main_menu_keyboard(),
    )


@router.message(lambda message: message.text == "💼 Barber panel")
async def barber_panel_login(message: Message, state: FSMContext) -> None:
    await state.set_state(BarberPanelState.entering_email)
    await message.answer("Barber email/login kiriting:", reply_markup=ReplyKeyboardRemove())


@router.message(BarberPanelState.entering_email)
async def barber_email_entered(message: Message, state: FSMContext) -> None:
    email = (message.text or "").strip()
    if "@" not in email:
        await message.answer("Email noto'g'ri. Qayta kiriting.")
        return
    await state.update_data(barber_email=email)
    await state.set_state(BarberPanelState.entering_password)
    await message.answer("Parolni kiriting:")


@router.message(BarberPanelState.entering_password)
async def barber_password_entered(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    try:
        token_data = await api.login(str(data["barber_email"]), message.text or "")
    except ApiClientError as exc:
        await message.answer(str(exc), reply_markup=main_menu_keyboard())
        await state.clear()
        return
    if token_data.get("role") != "barber":
        await message.answer("Bu panel faqat barberlar uchun.", reply_markup=main_menu_keyboard())
        await state.clear()
        return
    await state.update_data(barber_token=token_data["access_token"])
    await state.set_state()
    await message.answer("Barber panel:", reply_markup=barber_panel_keyboard())


@router.callback_query(lambda callback: callback.data == "barber_panel:today")
async def barber_panel_today(callback: CallbackQuery, state: FSMContext) -> None:
    data = await state.get_data()
    token = data.get("barber_token")
    if not token:
        await callback.message.answer("Avval Barber panel orqali login qiling.", reply_markup=main_menu_keyboard())
        await callback.answer()
        return
    today = datetime.now(ZoneInfo("Asia/Tashkent")).date().isoformat()
    try:
        bookings = await api.get_barber_bookings(str(token), today)
    except ApiClientError as exc:
        await callback.message.answer(str(exc), reply_markup=main_menu_keyboard())
        await callback.answer()
        return
    if not bookings:
        await callback.message.answer("Bugun bookinglar yo'q.", reply_markup=barber_panel_keyboard())
        await callback.answer()
        return
    for booking in bookings:
        text = (
            f"{booking.get('booking_code') or booking.get('id')}\n"
            f"👤 {booking.get('client_name')}\n"
            f"📞 {booking.get('client_phone')}\n"
            f"⏰ {booking.get('booking_time')}\n"
            f"Status: {booking.get('status')}"
        )
        markup = barber_booking_actions_keyboard(int(booking["id"])) if booking.get("status") == "pending" else None
        await callback.message.answer(text, reply_markup=markup)
    await callback.answer()


@router.callback_query(lambda callback: callback.data and callback.data.startswith("barber_action:"))
async def barber_action_start(callback: CallbackQuery, state: FSMContext) -> None:
    _, action, booking_id = str(callback.data).split(":", 2)
    await state.update_data(barber_action=action, barber_action_booking_id=int(booking_id))
    await state.set_state(BarberPanelState.entering_note)
    await callback.message.answer("Izoh kiriting:")
    await callback.answer()


@router.message(BarberPanelState.entering_note)
async def barber_action_note_entered(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    token = data.get("barber_token")
    if not token:
        await message.answer("Session tugagan. Qayta login qiling.", reply_markup=main_menu_keyboard())
        await state.clear()
        return
    action = str(data["barber_action"])
    booking_id = int(data["barber_action_booking_id"])
    try:
        booking = await api.update_barber_booking(str(token), booking_id, action, message.text or "")
    except ApiClientError as exc:
        await message.answer(str(exc), reply_markup=barber_panel_keyboard())
        await state.set_state()
        return
    if action == "complete" and booking.get("telegram_user_id"):
        try:
            await message.bot.send_message(int(booking["telegram_user_id"]), "✅ Sizning bookingingiz completed qilindi. Rahmat!")
        except Exception:
            pass
    await state.set_state()
    await message.answer(f"Booking yangilandi: {booking.get('status')}", reply_markup=barber_panel_keyboard())
