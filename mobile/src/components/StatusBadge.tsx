import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/theme";
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
  const { theme } = useTheme();
  const fallbackPalette = statusStyle[status] ?? statusStyle.pending;
  const palette =
    status === "completed"
      ? { bg: theme.colors.successBg, text: theme.colors.success, border: theme.colors.successLine }
      : status === "pending"
        ? { bg: theme.colors.warningBg, text: theme.colors.warning, border: theme.colors.warningLine }
        : status === "no_show"
          ? { bg: theme.colors.warningBg, text: theme.colors.orange, border: theme.colors.warningLine }
          : status === "cancelled"
            ? { bg: theme.colors.dangerBg, text: theme.colors.danger, border: theme.colors.dangerLine }
            : fallbackPalette;
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
