import { apiRequest } from "./client";
import type { BarberDayOff, BarberScheduleItem, BarberService, BarberVacation } from "../types/barber";
import type { BarberDashboard, BookingWithBarber } from "../types/booking";
import type { BarberBalance, BarberTransaction } from "../types/finance";

export function getBarberDashboard(date?: string) {
  return apiRequest<BarberDashboard>(`/barber/dashboard${date ? `?date=${date}` : ""}`);
}

export function getBarberBalance() {
  return apiRequest<BarberBalance>("/barber/balance");
}

export function getBarberTransactions() {
  return apiRequest<BarberTransaction[]>("/barber/transactions");
}

export function topUpBarberBalance(amount: number) {
  return apiRequest<BarberBalance>("/barber/balance/top-up", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export function getBarberSchedule(params: { date?: string; status?: string }) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return apiRequest<BookingWithBarber[]>(`/barber/bookings?${query.toString()}`);
}

export function updateBarberBookingStatus(id: number, status: "pending" | "completed" | "cancelled" | "no_show") {
  return apiRequest<BookingWithBarber>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function completeBarberBooking(id: number) {
  return apiRequest<BookingWithBarber>(`/barber/bookings/${id}/complete`, {
    method: "PATCH",
  });
}

export function completeBarberBookingWithNote(id: number, note: string) {
  return apiRequest<BookingWithBarber>(`/barber/bookings/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function noShowBarberBooking(id: number, note: string) {
  return apiRequest<BookingWithBarber>(`/barber/bookings/${id}/no-show`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function cancelBarberBooking(id: number, note: string) {
  return apiRequest<BookingWithBarber>(`/barber/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export function getBarberServices() {
  return apiRequest<BarberService[]>("/barber/services");
}

export function createBarberService(payload: Omit<BarberService, "id" | "barber_id" | "created_at" | "updated_at">) {
  return apiRequest<BarberService>("/barber/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBarberService(
  id: number,
  payload: Omit<BarberService, "id" | "barber_id" | "created_at" | "updated_at">,
) {
  return apiRequest<BarberService>(`/barber/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBarberService(id: number) {
  return apiRequest<void>(`/barber/services/${id}`, { method: "DELETE" });
}

export function getBarberWorkingSchedule() {
  return apiRequest<BarberScheduleItem[]>("/barber/schedule");
}

export function saveBarberWorkingSchedule(payload: BarberScheduleItem[]) {
  return apiRequest<BarberScheduleItem[]>("/barber/schedule", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createBarberDayOff(payload: { date: string; reason?: string | null }) {
  return apiRequest<BarberDayOff>("/barber/day-offs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBarberDayOffs() {
  return apiRequest<BarberDayOff[]>("/barber/day-offs");
}

export function deleteBarberDayOff(id: number) {
  return apiRequest<void>(`/barber/day-offs/${id}`, { method: "DELETE" });
}

export function createBarberVacation(payload: { start_date: string; end_date: string; reason?: string | null }) {
  return apiRequest<BarberVacation>("/barber/vacations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBarberVacations() {
  return apiRequest<BarberVacation[]>("/barber/vacations");
}

export function deleteBarberVacation(id: number) {
  return apiRequest<void>(`/barber/vacations/${id}`, { method: "DELETE" });
}
