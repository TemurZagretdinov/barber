from typing import Any, TypedDict

import httpx

from bot.config import settings


class ApiClientError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class Barber(TypedDict, total=False):
    id: int
    name: str
    full_name: str
    specialty: str
    rating: float
    average_rating: float
    location_text: str
    address: str
    price_from: float
    distance_km: float
    services: list[str]


class AvailableSlot(TypedDict, total=False):
    time: str
    is_available: bool
    is_booked: bool


class BarberService(TypedDict, total=False):
    id: int
    barber_id: int
    name: str
    description: str
    price: float
    duration_minutes: int
    is_active: bool


class Booking(TypedDict, total=False):
    id: int
    booking_code: str
    client_name: str
    client_phone: str
    barber_id: int
    booking_date: str
    booking_time: str
    status: str


def _detail_message(payload: Any) -> str:
    if isinstance(payload, dict):
        detail = payload.get("detail")
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            messages = [str(item.get("msg", item)) if isinstance(item, dict) else str(item) for item in detail]
            return ", ".join(messages)
    return "Xatolik yuz berdi. Iltimos keyinroq urinib ko‘ring."


class BackendApiClient:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = (base_url or settings.backend_url).rstrip("/")

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        timeout = httpx.Timeout(10.0, connect=5.0)
        async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout) as client:
            try:
                response = await client.request(method, path, **kwargs)
            except httpx.RequestError as exc:
                raise ApiClientError("Server bilan bog‘lanishda muammo bor. Keyinroq urinib ko‘ring.") from exc

        if response.status_code == 404:
            raise ApiClientError("Booking topilmadi.", status_code=response.status_code)
        if response.status_code >= 500:
            raise ApiClientError("Xatolik yuz berdi. Iltimos keyinroq urinib ko‘ring.", status_code=response.status_code)
        if response.status_code >= 400:
            try:
                payload = response.json()
            except ValueError:
                payload = None
            raise ApiClientError(_detail_message(payload), status_code=response.status_code)

        if not response.content:
            return None
        return response.json()

    async def get_barbers(
        self,
        *,
        sort: str | None = None,
        user_lat: float | None = None,
        user_lng: float | None = None,
    ) -> list[Barber]:
        timeout = httpx.Timeout(10.0, connect=5.0)
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=timeout) as client:
                params: dict[str, Any] = {}
                if sort:
                    params["sort"] = sort
                if user_lat is not None:
                    params["user_lat"] = user_lat
                if user_lng is not None:
                    params["user_lng"] = user_lng
                response = await client.get("/public/barbers", params=params)

            if response.status_code >= 400:
                if response.status_code == 404:
                    raise ApiClientError("Booking topilmadi.", status_code=response.status_code)
                if response.status_code >= 500:
                    raise ApiClientError(
                        "Server bilan bog‘lanishda muammo bor. Keyinroq urinib ko‘ring.",
                        status_code=response.status_code,
                    )
                try:
                    payload = response.json()
                except ValueError:
                    payload = None
                raise ApiClientError(_detail_message(payload), status_code=response.status_code)

            payload = response.json() if response.content else []
            if isinstance(payload, list):
                raw_barbers = payload
            elif isinstance(payload, dict):
                items = payload.get("items")
                barbers = payload.get("barbers")
                raw_barbers = items if isinstance(items, list) else barbers if isinstance(barbers, list) else []
            else:
                raw_barbers = []

            normalized_barbers: list[Barber] = []
            for item in raw_barbers:
                if not isinstance(item, dict):
                    continue
                barber_id = item.get("id")
                name = item.get("full_name") or item.get("name") or "Noma'lum barber"
                rating = item.get("average_rating") or item.get("rating") or 0
                specialty = item.get("specialty") or "Barber"
                try:
                    rating_value = float(rating)
                except (TypeError, ValueError):
                    rating_value = 0.0
                normalized_item = dict(item)
                normalized_item["id"] = barber_id
                normalized_item["full_name"] = str(name)
                normalized_item["specialty"] = str(specialty)
                normalized_item["rating"] = rating_value
                normalized_barbers.append(Barber(**normalized_item))
            return normalized_barbers
        except ApiClientError:
            raise
        except Exception as e:
            print("BARBER FETCH ERROR:", repr(e))
            raise ApiClientError("Server bilan bog‘lanishda muammo bor. Keyinroq urinib ko‘ring.") from e

    async def get_barber(self, barber_id: int) -> Barber:
        return await self._request("GET", f"/public/barbers/{barber_id}")

    async def get_availability(self, barber_id: int, booking_date: str) -> list[AvailableSlot]:
        return await self._request("GET", f"/public/barbers/{barber_id}/availability", params={"date": booking_date})

    async def get_services(self, barber_id: int) -> list[BarberService]:
        return await self._request("GET", f"/public/barbers/{barber_id}/services")

    async def get_service_availability(self, barber_id: int, service_id: int, booking_date: str) -> list[AvailableSlot]:
        return await self._request(
            "GET",
            f"/public/barbers/{barber_id}/availability",
            params={"date": booking_date, "service_id": service_id},
        )

    async def create_booking(
        self,
        *,
        barber_id: int,
        service_id: int,
        client_name: str,
        client_phone: str,
        appointment_date: str,
        appointment_time: str,
        telegram_user_id: int | None = None,
    ) -> Booking:
        payload: dict[str, Any] = {
            "barber_id": barber_id,
            "service_id": service_id,
            "client_name": client_name,
            "client_phone": client_phone,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
        }
        if telegram_user_id is not None:
            payload["telegram_user_id"] = telegram_user_id
        return await self._request("POST", "/public/bookings", json=payload)

    async def get_booking(self, booking_code: str) -> Booking:
        return await self._request("GET", f"/public/bookings/{booking_code}")

    async def login(self, email: str, password: str) -> dict[str, Any]:
        return await self._request("POST", "/auth/login", json={"email": email, "password": password})

    async def get_barber_bookings(self, token: str, booking_date: str | None = None) -> list[Booking]:
        params = {"date": booking_date} if booking_date else None
        return await self._request("GET", "/barber/bookings", params=params, headers={"Authorization": f"Bearer {token}"})

    async def update_barber_booking(self, token: str, booking_id: int, action: str, note: str | None = None) -> Booking:
        path_action = "no-show" if action == "no_show" else action
        return await self._request(
            "PATCH",
            f"/barber/bookings/{booking_id}/{path_action}",
            json={"note": note},
            headers={"Authorization": f"Bearer {token}"},
        )
