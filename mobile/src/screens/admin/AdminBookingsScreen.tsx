import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getAdminBookings, updateBookingStatus } from "../../api/bookings";
import { AdminPageHeader, AdminPanel } from "../../components/admin/AdminPanel";
import { adminColors, adminRadius, adminSpacing, adminTypography } from "../../components/admin/adminTheme";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import type { BookingStatus, BookingWithBarber } from "../../types/booking";
import { formatDateLong, formatTime } from "../../utils/date";

const statuses = ["all", "pending", "completed", "cancelled", "no_show"] as const;

export function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookings(await getAdminBookings({ status: status === "all" ? undefined : status, search: search || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(
    () => ({
      total: bookings.length,
      done: bookings.filter((item) => item.status === "completed").length,
      pending: bookings.filter((item) => item.status === "pending").length,
    }),
    [bookings],
  );

  async function changeStatus(id: number, nextStatus: BookingStatus) {
    await updateBookingStatus(id, nextStatus);
    await load();
  }

  return (
    <ScreenContainer>
      <AdminPageHeader title="Bookings" subtitle="Monitor and manage all appointments" />

      <AdminPanel style={styles.summaryPanel}>
        <View style={styles.summaryRow}>
          <SummaryPill label={`${totals.total} total`} />
          <SummaryPill label={`${totals.done} done`} tone="success" />
          <SummaryPill label={`${totals.pending} pending`} tone="warning" />
        </View>
      </AdminPanel>

      <AdminPanel style={styles.filterPanel}>
        <View style={styles.searchBox}>
          <Ionicons name="search" color={adminColors.muted} size={19} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by client, phone, ID" style={styles.searchInput} placeholderTextColor="#aab2bf" />
        </View>
        <View style={styles.filters}>
          {statuses.map((item) => (
            <Pressable
              key={item}
              onPress={() => setStatus(item)}
              style={({ pressed }) => [styles.filter, status === item && styles.filterActive, pressed && styles.pressed]}
            >
              <Text style={[styles.filterText, status === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </AdminPanel>

      {loading ? <ActivityIndicator style={styles.state} color="#C9A96E" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && bookings.length === 0 ? <Text style={styles.empty}>No bookings found.</Text> : null}

      <View style={styles.list}>
        {bookings.map((booking) => (
          <AdminPanel key={booking.id} style={styles.bookingCard}>
            <View style={styles.row}>
              <View style={styles.clientBlock}>
                <Text style={styles.client} numberOfLines={1}>{booking.client_name}</Text>
                <Text style={styles.muted} numberOfLines={1}>{booking.client_phone}</Text>
                <Text style={styles.idText}>ID #{booking.id}</Text>
              </View>
              <StatusBadge status={booking.status} />
            </View>
            <Text style={styles.muted} numberOfLines={1}>{booking.barber_name}</Text>
            <Text style={styles.time}>{formatDateLong(booking.booking_date)} at {formatTime(booking.booking_time)}</Text>
            <View style={styles.actions}>
              {(["pending", "cancelled", "no_show"] as BookingStatus[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => changeStatus(booking.id, item)}
                  style={({ pressed }) => [styles.action, booking.status === item && styles.actionActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.actionText, booking.status === item && styles.actionTextActive]}>{item}</Text>
                </Pressable>
              ))}
              {booking.status === "completed" ? (
                <Pressable style={[styles.action, styles.actionActive]}>
                  <Text style={styles.actionTextActive}>completed</Text>
                </Pressable>
              ) : null}
            </View>
          </AdminPanel>
        ))}
      </View>
    </ScreenContainer>
  );
}

function SummaryPill({ label, tone }: { label: string; tone?: "success" | "warning" }) {
  return (
    <View style={[styles.summaryPill, tone === "success" && styles.summarySuccess, tone === "warning" && styles.summaryWarning]}>
      <Text style={[styles.summaryText, tone === "success" && styles.summarySuccessText, tone === "warning" && styles.summaryWarningText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryPanel: {
    marginBottom: adminSpacing.md,
    padding: adminSpacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: adminSpacing.sm,
  },
  summaryPill: {
    borderRadius: adminRadius.pill,
    backgroundColor: "#1C1C1C",
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  summarySuccess: {
    backgroundColor: adminColors.successBg,
  },
  summaryWarning: {
    backgroundColor: adminColors.warningBg,
  },
  summaryText: {
    ...adminTypography.label,
    color: "#888888",
  },
  summarySuccessText: {
    color: adminColors.successText,
  },
  summaryWarningText: {
    color: adminColors.warningText,
  },
  filterPanel: {
    gap: adminSpacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.line,
    borderRadius: adminRadius.md,
    minHeight: 54,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: adminColors.text,
    fontWeight: "400",
  },
  filters: {
    flexDirection: "row",
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.soft,
    padding: 4,
  },
  filter: {
    flex: 1,
    alignItems: "center",
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  filterActive: {
    backgroundColor: "#C9A96E",
  },
  filterText: {
    color: adminColors.muted,
    fontWeight: "600",
    textTransform: "capitalize",
    fontSize: 12,
  },
  filterTextActive: {
    color: "#0A0A0A",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  state: {
    marginTop: adminSpacing.lg,
  },
  error: {
    color: adminColors.danger,
    marginTop: adminSpacing.md,
    fontWeight: "500",
  },
  empty: {
    ...adminTypography.body,
    color: adminColors.muted,
    marginTop: adminSpacing.lg,
    textAlign: "center",
  },
  list: {
    marginTop: adminSpacing.md,
    gap: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  bookingCard: {
    gap: adminSpacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: adminSpacing.sm,
  },
  clientBlock: {
    flex: 1,
    minWidth: 0,
  },
  client: {
    ...adminTypography.cardTitle,
  },
  muted: {
    ...adminTypography.body,
    color: adminColors.muted,
  },
  idText: {
    ...adminTypography.label,
    marginTop: 2,
  },
  time: {
    ...adminTypography.body,
    color: adminColors.body,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.soft,
    padding: 4,
    marginTop: adminSpacing.xs,
  },
  action: {
    flex: 1,
    alignItems: "center",
    borderRadius: adminRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 9,
  },
  actionActive: {
    backgroundColor: "#C9A96E",
  },
  actionText: {
    color: adminColors.muted,
    fontWeight: "600",
    textTransform: "capitalize",
    fontSize: 12,
  },
  actionTextActive: {
    color: "#0A0A0A",
  },
});
