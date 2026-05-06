import { apiRequest } from "./client";
import type { AvailableSlot, Barber, BarberService } from "../types/barber";

export type BarberSort = "nearest" | "cheapest" | "expensive";

export interface PublicBarberParams {
  sort?: BarberSort;
  userLat?: number;
  userLng?: number;
}

export function getPublicBarbers(params: PublicBarberParams = {}) {
  const query = new URLSearchParams();
  if (params.sort) query.set("sort", params.sort);
  if (typeof params.userLat === "number") query.set("user_lat", String(params.userLat));
  if (typeof params.userLng === "number") query.set("user_lng", String(params.userLng));
  const suffix = query.toString() ? `?${query}` : "";
  return apiRequest<Barber[]>(`/public/barbers${suffix}`);
}

export function getPublicBarber(id: number) {
  return apiRequest<Barber>(`/public/barbers/${id}`);
}

export function getPublicBarberServices(barberId: number) {
  return apiRequest<BarberService[]>(`/public/barbers/${barberId}/services`);
}

export function getAvailableSlots(barberId: number, date: string, serviceId?: number) {
  const query = new URLSearchParams({ date });
  if (serviceId) query.set("service_id", String(serviceId));
  return apiRequest<AvailableSlot[]>(`/public/barbers/${barberId}/availability?${query.toString()}`);
}
