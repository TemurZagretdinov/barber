export type BookingStatus = "pending" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: number;
  booking_code?: string;
  client_name: string;
  client_phone: string;
  barber_id: number;
  service_id?: number | null;
  customer_id?: number | null;
  booking_date: string;
  booking_time: string;
  appointment_date?: string;
  appointment_time?: string;
  status: BookingStatus;
  price?: number | null;
  duration_minutes?: number | null;
  notes?: string | null;
  service_note?: string | null;
  completed_at?: string | null;
  telegram_user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithBarber extends Booking {
  barber_name: string;
  barber_photo_url?: string | null;
  barber_specialty?: string | null;
  service_name?: string | null;
}

export interface BookingCreate {
  barber_id: number;
  service_id: number;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
}

export interface AdminDashboard {
  total_barbers: number;
  active_barbers: number;
  today_bookings: number;
  completed_bookings: number;
  top_barbers: Array<{
    id: number;
    full_name: string;
    bookings_count: number;
    completed_count: number;
    revenue: number;
  }>;
}

export interface LegacyAdminDashboard {
  stats: {
    total_bookings: number;
    active_barbers: number;
    completed: number;
    pending: number;
    today_bookings: number;
  };
  performance: Array<{
    barber_id: number;
    full_name: string;
    photo_url: string;
    completed: number;
    pending: number;
    total: number;
  }>;
  recent_bookings: BookingWithBarber[];
}

export interface BarberDashboard {
  today_bookings: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  today_revenue: number;
  week_revenue: number;
  week_completed: number;
  bookings: Array<{
    id: number;
    code: string;
    customer_name: string;
    customer_phone: string;
    date: string;
    time: string;
    status: BookingStatus;
    price?: number | null;
    service_note?: string | null;
  }>;
}

export interface LegacyBarberDashboard {
  barber_id: number;
  full_name: string;
  photo_url: string;
  specialty: string;
  today: number;
  done: number;
  pending: number;
  appointments: BookingWithBarber[];
}
