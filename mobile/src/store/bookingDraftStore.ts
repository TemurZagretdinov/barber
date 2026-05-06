import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKING_DRAFT_KEY = "sharp-cuts-mobile-booking-draft";

export interface BookingDraft {
  barberId: number;
  serviceId: number;
  date: string;
  time: string;
}

export async function saveBookingDraft(draft: BookingDraft): Promise<void> {
  await AsyncStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
}

export async function loadBookingDraft(): Promise<BookingDraft | null> {
  const raw = await AsyncStorage.getItem(BOOKING_DRAFT_KEY);
  return raw ? (JSON.parse(raw) as BookingDraft) : null;
}

export async function clearBookingDraft(): Promise<void> {
  await AsyncStorage.removeItem(BOOKING_DRAFT_KEY);
}
