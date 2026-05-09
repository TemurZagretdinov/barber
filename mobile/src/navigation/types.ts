import type { NavigatorScreenParams } from "@react-navigation/native";

import type { Barber, BarberService } from "../types/barber";
import type { Booking, BookingWithBarber } from "../types/booking";
import type { Role } from "../types/auth";

export type BookingSource = "public" | "customer";

export type PublicStackParamList = {
  ChooseBarber: { bookingSource?: BookingSource } | undefined;
  SelectService: { barberId: number; barber: Barber; bookingSource?: BookingSource };
  SelectTime: { barberId: number; barber: Barber; service: BarberService; bookingSource?: BookingSource };
  BookingDetails: { barber: Barber; service: BarberService; date: string; time: string; bookingSource?: BookingSource };
  BookingSuccess: { booking: Booking; barberName: string; bookingSource?: BookingSource };
  FindBooking: undefined;
  CustomerCabinet: { bookingCode?: string } | undefined;
};

export type RootStackParamList = {
  Public: NavigatorScreenParams<PublicStackParamList> | undefined;
  RoleSelect: undefined;
  Login: { role: Exclude<Role, "customer"> };
  Admin: undefined;
  Barber: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminBookings: undefined;
  AdminBarbers: undefined;
};

export type BarberStackParamList = {
  BarberDashboard: undefined;
  BarberSchedule: { initialBookings?: BookingWithBarber[] } | undefined;
};
