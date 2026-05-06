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
  status: BookingStatus;
  price?: number | null;
  duration_minutes: number;
  notes?: string | null;
  service_note?: string | null;
  completed_at?: string | null;
  reminder_sent_at?: string | null;
  telegram_user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithBarber extends Booking {
  barber_name: string;
  barber_photo_url?: string | null;
  barber_specialty?: string | null;
  barber_address?: string | null;
  barbershop_name?: string | null;
  service_name?: string | null;
}

export interface BookingCreate {
  client_name: string;
  client_phone: string;
  barber_id: number;
  service_id: number;
  appointment_date: string;
  appointment_time: string;
  notes?: string | null;
  telegram_user_id?: number | null;
}

export interface BookingReview {
  id: number;
  booking_id: number;
  customer_id: number;
  barber_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
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
