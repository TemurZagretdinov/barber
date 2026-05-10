export interface Barber {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  specialty: string;
  barbershop_name?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  avatar?: string | null;
  rating?: number | null;
  average_rating?: number | null;
  years_experience?: number | null;
  completed_bookings_count?: number | null;
  price_from?: number | null;
  base_price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
  off_days?: string[];
  distance_km?: number | null;
  location_text?: string | null;
  services?: string[] | null;
  bio?: string | null;
  is_active: boolean;
  is_financially_blocked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminBarber extends Barber {
  total_bookings: number;
  today_bookings: number;
  balance?: number;
  debt?: number;
  commission_percent?: number;
}

export interface BarberFormPayload {
  full_name: string;
  specialty: string;
  barbershop_name?: string | null;
  photo_url: string;
  phone?: string | null;
  rating: number;
  years_experience: number;
  price_from?: number | null;
  base_price?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
  off_days?: string[];
  email: string;
  password?: string;
  bio?: string | null;
  is_active?: boolean;
}

export interface AvailableSlot {
  time: string;
  is_available: boolean;
  is_booked: boolean;
  is_expired?: boolean;
}

export interface BarberService {
  id: number;
  barber_id: number;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarberScheduleItem {
  id?: number;
  weekday: number;
  start_time: string;
  end_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
  is_working: boolean;
}

export interface BarberDayOff {
  id: number;
  barber_id: number;
  date: string;
  reason?: string | null;
}

export interface BarberVacation {
  id: number;
  barber_id: number;
  start_date: string;
  end_date: string;
  reason?: string | null;
}
