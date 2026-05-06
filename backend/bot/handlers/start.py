from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.keyboards import main_menu_keyboard

router = Router()


@router.message(CommandStart())
async def start(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(
        "Assalomu alaykum! Sharp Cuts booking botiga xush kelibsiz ✂️",
        reply_markup=main_menu_keyboard(),
    )


@router.message(lambda message: message.text == "ℹ️ Yordam")
async def help_message(message: Message) -> None:
    await message.answer(
        "✂️ Barber tanlash orqali yangi booking yarating.\n"
        "📋 Mening bookingim orqali booking code bilan ma’lumotni tekshiring.",
        reply_markup=main_menu_keyboard(),
    )
