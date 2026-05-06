import { apiRequest } from "./client";
import type { Booking, BookingCreate, BookingReview, BookingWithBarber, NotificationItem } from "../types/booking";
import type { Barber } from "../types/barber";

export function createBooking(payload: BookingCreate) {
  return apiRequest<Booking>("/public/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCustomerBookings() {
  return apiRequest<BookingWithBarber[]>("/customer/bookings");
}

export function claimBooking(bookingCode: string) {
  return apiRequest<BookingWithBarber>("/customer/bookings/claim", {
    method: "POST",
    body: JSON.stringify({ booking_code: bookingCode }),
  });
}

export function getCustomerBookingHistory() {
  return apiRequest<BookingWithBarber[]>("/customer/bookings/history");
}

export function cancelCustomerBooking(id: number) {
  return apiRequest<BookingWithBarber>(`/customer/bookings/${id}/cancel`, { method: "PATCH" });
}

export function rescheduleCustomerBooking(id: number, payload: { appointment_date: string; appointment_time: string }) {
  return apiRequest<BookingWithBarber>(`/customer/bookings/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function reviewCustomerBooking(id: number, payload: { rating: number; comment?: string | null }) {
  return apiRequest<BookingReview>(`/customer/bookings/${id}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCustomerFavorites() {
  return apiRequest<Barber[]>("/customer/favorites");
}

export function addCustomerFavorite(barberId: number) {
  return apiRequest<Barber>(`/customer/favorites/${barberId}`, { method: "POST" });
}

export function removeCustomerFavorite(barberId: number) {
  return apiRequest<void>(`/customer/favorites/${barberId}`, { method: "DELETE" });
}

export function getNotifications() {
  return apiRequest<NotificationItem[]>("/notifications");
}
