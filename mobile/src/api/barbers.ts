import { apiClient } from "./client";
import { ApiError } from "./client";
import type { AvailableSlot, Barber, BarberFormPayload, BarberService } from "../types/barber";

const fallbackImage = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80";

type RawBarber = Partial<Barber> & {
  name?: string | null;
  experience_years?: number | null;
};

type RawSlot =
  | string
  | {
      time?: string | null;
      start_time?: string | null;
      available?: boolean | null;
      is_available?: boolean | null;
      is_booked?: boolean | null;
      is_expired?: boolean | null;
      reason?: string | null;
    };

export type BarberSort = "nearest" | "cheapest" | "expensive";

export interface PublicBarberParams {
  sort?: BarberSort;
  userLat?: number;
  userLng?: number;
}

function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === "object") {
    const objectValue = value as { items?: unknown; slots?: unknown; data?: unknown };
    if (Array.isArray(objectValue.items)) {
      return objectValue.items as T[];
    }
    if (Array.isArray(objectValue.slots)) {
      return objectValue.slots as T[];
    }
    if (Array.isArray(objectValue.data)) {
      return objectValue.data as T[];
    }
  }
  return [];
}

export function normalizeBarber(barber: RawBarber): Barber {
  const id = Number(barber.id);
  const fullName = barber.full_name || barber.name || "Barber";
  const specialty = barber.specialty || "Professional Barber";
  const rating = barber.average_rating ?? barber.rating ?? 0;
  const photoUrl = barber.avatar || barber.photo_url || fallbackImage;
  const yearsExperience = barber.years_experience ?? barber.experience_years ?? null;

  return {
    ...barber,
    id,
    user_id: barber.user_id ?? id,
    email: barber.email ?? "",
    full_name: fullName,
    specialty,
    barbershop_name: barber.barbershop_name ?? null,
    photo_url: photoUrl,
    avatar: photoUrl,
    phone: barber.phone ?? null,
    rating,
    average_rating: rating,
    years_experience: yearsExperience,
    price_from: barber.price_from ?? null,
    base_price: barber.base_price ?? barber.price_from ?? null,
    latitude: barber.latitude ?? null,
    longitude: barber.longitude ?? null,
    address: barber.address ?? null,
    work_start_time: barber.work_start_time ?? null,
    work_end_time: barber.work_end_time ?? null,
    off_days: barber.off_days ?? [],
    distance_km: barber.distance_km ?? null,
    is_active: barber.is_active ?? true,
    created_at: barber.created_at ?? "",
    updated_at: barber.updated_at ?? "",
  };
}

function normalizeSlot(slot: RawSlot): AvailableSlot {
  if (typeof slot === "string") {
    return {
      time: slot.slice(0, 5),
      is_available: true,
      is_booked: false,
      is_expired: false,
    };
  }

  const time = slot.time || slot.start_time || "";

  const isBooked = slot.is_booked ?? (slot.reason === "booked");
  const isExpired = slot.is_expired ?? (slot.reason === "expired");
  const isAvailable = slot.is_available ?? slot.available ?? !(isBooked || isExpired);

  return {
    time: time.slice(0, 5),
    is_available: isAvailable,
    is_booked: isBooked,
    is_expired: isExpired,
    available: slot.available ?? isAvailable,
    reason: slot.reason ?? null,
  };
}

export async function getPublicBarbers(params: PublicBarberParams = {}): Promise<Barber[]> {
  const query: Record<string, string | number> = {};
  if (params.sort) query.sort = params.sort;
  if (typeof params.userLat === "number") query.user_lat = params.userLat;
  if (typeof params.userLng === "number") query.user_lng = params.userLng;
  const response = await apiClient.get<unknown>("/public/barbers", { params: query });
  return asList<RawBarber>(response.data).map(normalizeBarber).filter((barber) => Number.isFinite(barber.id));
}

export async function getPublicBarber(id: number): Promise<Barber> {
  const response = await apiClient.get<RawBarber>(`/public/barbers/${id}`);
  return normalizeBarber(response.data);
}

export async function getPublicBarberServices(barberId: number): Promise<BarberService[]> {
  const response = await apiClient.get<unknown>(`/public/barbers/${barberId}/services`);
  return asList<BarberService>(response.data);
}

export async function getAvailableSlots(barberId: number, date: string, serviceId?: number): Promise<AvailableSlot[]> {
  const params = { date, service_id: serviceId };
  try {
    const response = await apiClient.get<unknown>(`/public/barbers/${barberId}/available-slots`, {
      params,
      silentStatuses: [404],
    });
    return asList<RawSlot>(response.data).map(normalizeSlot).filter((slot) => slot.time);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
    const response = await apiClient.get<unknown>(`/public/barbers/${barberId}/availability`, { params });
    return asList<RawSlot>(response.data).map(normalizeSlot).filter((slot) => slot.time);
  }
}

export async function getAdminBarbers(): Promise<Barber[]> {
  const response = await apiClient.get<Barber[]>("/barbers");
  return response.data;
}

export async function createAdminBarber(payload: BarberFormPayload): Promise<Barber> {
  const response = await apiClient.post<Barber>("/barbers", payload);
  return response.data;
}
