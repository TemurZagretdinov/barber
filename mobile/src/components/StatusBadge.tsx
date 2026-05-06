import { StyleSheet, Text, View } from "react-native";

import type { BookingStatus } from "../types/booking";

// Dark-theme luxury status palette
const statusStyle = {
  pending: { bg: "#1A1200", text: "#C9A96E", border: "#3A2800" },
  completed: { bg: "#001A0D", text: "#10b981", border: "#003020" },
  cancelled: { bg: "#1A0000", text: "#EF4444", border: "#3A1010" },
  no_show: { bg: "#1A0D00", text: "#F97316", border: "#3A2200" },
} satisfies Record<BookingStatus, { bg: string; text: string; border: string }>;

const statusLabel: Record<BookingStatus, string> = {
  pending: "Kutilmoqda",
  completed: "Tasdiqlandi",
  cancelled: "Bekor",
  no_show: "Kelmadi",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const palette = statusStyle[status] ?? statusStyle.pending;
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {statusLabel[status] ?? status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  text: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
