import { apiClient } from "./client";
import type { AdminDashboard, BarberDashboard, Booking, BookingCreate, BookingStatus, BookingWithBarber } from "../types/booking";

export async function createBooking(payload: BookingCreate): Promise<Booking> {
  const response = await apiClient.post<Booking>("/public/bookings", payload);
  return response.data;
}

export async function findBooking(code: string): Promise<Booking> {
  const response = await apiClient.get<Booking>(`/public/bookings/${code}`);
  return response.data;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const response = await apiClient.get<AdminDashboard>("/admin/dashboard");
  return response.data;
}

export async function getAdminBookings(params?: { status?: string; search?: string }): Promise<BookingWithBarber[]> {
  const response = await apiClient.get<BookingWithBarber[]>("/bookings", { params });
  return response.data;
}

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/bookings/${id}/status`, { status });
  return response.data;
}

export async function completeBarberBooking(id: number): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/barber/bookings/${id}/complete`);
  return response.data;
}

export async function completeBarberBookingWithNote(id: number, note: string): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/barber/bookings/${id}/complete`, { note });
  return response.data;
}

export async function noShowBarberBooking(id: number, note: string): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/barber/bookings/${id}/no-show`, { note });
  return response.data;
}

export async function cancelBarberBooking(id: number, note: string): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/barber/bookings/${id}/cancel`, { note });
  return response.data;
}

export async function getBarberDashboard(date: string): Promise<BarberDashboard> {
  const response = await apiClient.get<BarberDashboard>("/barber/dashboard", { params: { date } });
  return response.data;
}

export async function getBarberSchedule(params: { date: string; status?: string }): Promise<BookingWithBarber[]> {
  const response = await apiClient.get<BookingWithBarber[]>("/barber/bookings", { params });
  return response.data;
}

export async function getCustomerBookings(): Promise<BookingWithBarber[]> {
  const response = await apiClient.get<BookingWithBarber[]>("/customer/bookings");
  return response.data;
}

export async function getCustomerBookingHistory(): Promise<BookingWithBarber[]> {
  const response = await apiClient.get<BookingWithBarber[]>("/customer/bookings/history");
  return response.data;
}

export async function cancelCustomerBooking(id: number): Promise<BookingWithBarber> {
  const response = await apiClient.patch<BookingWithBarber>(`/customer/bookings/${id}/cancel`);
  return response.data;
}

export async function reviewCustomerBooking(id: number, payload: { rating: number; comment?: string | null }) {
  const response = await apiClient.post(`/customer/bookings/${id}/review`, payload);
  return response.data;
}
