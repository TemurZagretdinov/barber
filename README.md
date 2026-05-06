# Barber Shop Booking App

Fullstack appointment booking app for a barbershop.

## Run Backend

Python 3.12 is recommended.

```powershell
cd backend
copy .env.example .env
py -3.12 -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
cd app
alembic upgrade head
cd ..
python -m app.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

Backend URL: `http://127.0.0.1:8080`
Swagger docs: `http://127.0.0.1:8080/docs`

## Run Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## Run Mobile App

The mobile app lives in `mobile/` and uses the same FastAPI backend.

Start the backend for emulator or real phone access:

```powershell
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8090
```

Create the mobile env file:

```powershell
cd mobile
copy .env.example .env
```

API URL examples:

```env
# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8090

# Expo Go on a real phone
EXPO_PUBLIC_API_BASE_URL=http://YOUR_PC_LOCAL_IP:8090
```

For Expo Go on a real phone, replace `YOUR_PC_LOCAL_IP` with your computer's LAN IP. The phone and computer must be on the same Wi-Fi network.

Install and start:

```powershell
cd mobile
npm install
npx expo start
```

## Run Telegram Bot

1. Create a bot in BotFather and copy the token.
2. Put the token into `backend/.env`:

```env
BOT_TOKEN=your_bot_token_here
BACKEND_API_URL=http://127.0.0.1:8080
ADMIN_TELEGRAM_IDS=123456789
```

`ADMIN_TELEGRAM_IDS` can contain multiple IDs separated by commas, for example `123,456`.

3. Start the backend first:

```powershell
cd backend
.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

4. Start the bot in another terminal:

```powershell
cd backend
.venv\Scripts\activate
python -m bot.main
```

## Default Accounts

- Admin: `admin@gmail.com` / `admin123`
- Barbers: `jamshid@gmail.com`, `azizbek@gmail.com`, `bekzod@gmail.com` / `123456`

## Notes

- PostgreSQL must be running and `DATABASE_URL` in `backend/.env` must point to the `barber_booking` database.
- Public booking routes do not require login: `/public/barbers`, `/public/barbers/{id}/availability`, `/public/bookings`.
- Admin routes require `role=admin`: `/dashboard`, `/barbers`, `/bookings`.
- Barber routes require `role=barber`: `/bookings/dashboard`, `/bookings/me`.
