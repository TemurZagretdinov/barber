import { apiRequest } from "./client";
import type { AdminBarber, Barber, BarberFormPayload } from "../types/barber";
import type { AdminDashboard, BookingStatus, BookingWithBarber } from "../types/booking";
import type { AdminBarberFinance, AdminFinanceOverview, SettlementRunResponse } from "../types/finance";

export function getAdminDashboard() {
  return apiRequest<AdminDashboard>("/admin/dashboard");
}

export function getAdminFinanceOverview() {
  return apiRequest<AdminFinanceOverview>("/admin/finance/overview");
}

export function getAdminBarberFinance(barberId: number) {
  return apiRequest<AdminBarberFinance>(`/admin/barbers/${barberId}/finance`);
}

export function runAdminSettlement(date: string) {
  return apiRequest<SettlementRunResponse>("/admin/settlements/run", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
}

export function adjustAdminBarberBalance(barberId: number, payload: { amount: number; description: string }) {
  return apiRequest<AdminBarberFinance>(`/admin/barbers/${barberId}/adjust-balance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminBarbers() {
  return apiRequest<AdminBarber[]>("/barbers");
}

export function createAdminBarber(payload: BarberFormPayload) {
  return apiRequest<Barber>("/barbers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminBarber(id: number, payload: BarberFormPayload) {
  return apiRequest<Barber>(`/barbers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminBarber(id: number) {
  return apiRequest<void>(`/barbers/${id}`, { method: "DELETE" });
}

export function getAdminBookings(params: {
  date?: string;
  status?: string;
  barber_id?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return apiRequest<BookingWithBarber[]>(`/bookings?${query.toString()}`);
}

export function updateBookingStatus(id: number, status: BookingStatus) {
  return apiRequest<BookingWithBarber>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
