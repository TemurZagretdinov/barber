from aiogram.fsm.state import State, StatesGroup


class BookingState(StatesGroup):
    selecting_barber = State()
    waiting_location = State()
    selecting_service = State()
    selecting_date = State()
    selecting_time = State()
    entering_name = State()
    entering_phone = State()
    confirming = State()


class BookingLookupState(StatesGroup):
    entering_code = State()


class BarberPanelState(StatesGroup):
    entering_email = State()
    entering_password = State()
    entering_note = State()
