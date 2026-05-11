import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAdminBookings, updateBookingStatus } from "../../api/bookings";
import { AdminPageHeader, AdminPanel } from "../../components/admin/AdminPanel";
import { adminColors, adminRadius, adminSpacing, adminTypography } from "../../components/admin/adminTheme";
import { MoneyText } from "../../components/MoneyText";
import { ResponsiveText } from "../../components/ResponsiveText";
import { ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import { useTheme } from "../../theme/theme";
import type { BookingStatus, BookingWithBarber } from "../../types/booking";
import { formatDateLong, formatTime } from "../../utils/date";

const statuses = ["all", "pending", "completed", "cancelled", "no_show"] as const;

const filterLabels: Record<string, string> = {
  all: "Barchasi",
  pending: "Kutmoqda",
  completed: "Tugadi",
  cancelled: "Bekor",
  no_show: "Kelmagan",
};

export function AdminBookingsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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
      setError(err instanceof Error ? err.message : "Bronlarni yuklashda xatolik");
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
    <ScreenContainer scroll={false}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <AdminPageHeader title="Bronlar" subtitle="Barcha bronlarni boshqarish" />

        <AdminPanel style={styles.summaryPanel}>
          <View style={styles.summaryRow}>
            <SummaryPill label={`${totals.total} jami`} />
            <SummaryPill label={`${totals.done} tugallangan`} tone="success" />
            <SummaryPill label={`${totals.pending} kutilmoqda`} tone="warning" />
          </View>
        </AdminPanel>

        <AdminPanel style={styles.filterPanel}>
          <View style={[styles.searchBox, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
            <Ionicons name="search" color={theme.colors.muted} size={19} />
            <TextInput 
              value={search} 
              onChangeText={setSearch} 
              placeholder="Mijoz, telefon yoki ID" 
              style={[styles.searchInput, { color: theme.colors.text }]} 
              placeholderTextColor={theme.colors.subtle} 
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <View style={[styles.filters, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
              {statuses.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={({ pressed }) => [
                    styles.filter,
                    status === item && { backgroundColor: theme.colors.gold },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.filterText, { color: status === item ? theme.colors.onGold : theme.colors.muted }]} numberOfLines={1}>
                    {filterLabels[item]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </AdminPanel>

        {loading ? <ActivityIndicator style={styles.state} color={theme.colors.gold} /> : null}
        {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
        {!loading && bookings.length === 0 ? <Text style={[styles.empty, { color: theme.colors.muted }]}>Bronlar topilmadi.</Text> : null}

        <View style={styles.list}>
          {bookings.map((booking) => (
            <AdminPanel key={booking.id} style={styles.bookingCard}>
              <View style={styles.row}>
                <View style={styles.clientBlock}>
                  <ResponsiveText variant="section" color="text" numberOfLines={1} ellipsizeMode="tail" style={styles.bookingTitle}>
                    {booking.client_name || "Mijoz"}
                  </ResponsiveText>
                </View>
                <StatusBadge status={booking.status} />
              </View>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <ResponsiveText variant="small" color="muted" numberOfLines={1} style={styles.bookingMeta}>
                  {booking.client_phone || "-"}
                </ResponsiveText>
                <Text style={[styles.idText, { color: theme.colors.subtle }]} numberOfLines={1} adjustsFontSizeToFit>ID #{booking.id}</Text>
              </View>

              <View style={[styles.detailsDivider, { backgroundColor: theme.colors.line }]} />

              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={theme.colors.muted} />
                <Text style={[styles.metaText, { color: theme.colors.muted }]} numberOfLines={1} ellipsizeMode="tail">
                  {booking.barber_name}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
                <Text style={[styles.metaText, { color: theme.colors.body }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatDateLong(booking.booking_date)} · {formatTime(booking.booking_time)}
                </Text>
              </View>

              {booking.service_name && (
                <View style={[styles.metaRow, { marginTop: 2 }]}>
                  <Ionicons name="cut-outline" size={14} color={theme.colors.muted} />
                  <Text style={[styles.metaText, { color: theme.colors.muted }]} numberOfLines={1} ellipsizeMode="tail">
                    {booking.service_name}
                  </Text>
                  {(booking.service_price || booking.price) ? (
                    <MoneyText amount={booking.service_price ?? booking.price ?? 0} color="gold" compact style={{ fontSize: 13, marginLeft: "auto" }} />
                  ) : null}
                </View>
              )}

              {booking.status === "pending" ? (
                <View style={[styles.actions, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
                  <Pressable onPress={() => changeStatus(booking.id, "completed")} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                    <Text style={[styles.actionText, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>Tugallash</Text>
                  </Pressable>
                  <View style={[styles.actionDivider, { backgroundColor: theme.colors.line }]} />
                  <Pressable onPress={() => changeStatus(booking.id, "cancelled")} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                    <Text style={[styles.actionText, { color: theme.colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>Bekor</Text>
                  </Pressable>
                  <View style={[styles.actionDivider, { backgroundColor: theme.colors.line }]} />
                  <Pressable onPress={() => changeStatus(booking.id, "no_show")} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                    <Text style={[styles.actionText, { color: theme.colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>Kelmagan</Text>
                  </Pressable>
                </View>
              ) : null}
            </AdminPanel>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SummaryPill({ label, tone }: { label: string; tone?: "success" | "warning" }) {
  const { theme } = useTheme();
  const palette = tone === "success"
    ? { backgroundColor: theme.colors.successBg, borderColor: theme.colors.successLine, color: theme.colors.success }
    : tone === "warning"
      ? { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningLine, color: theme.colors.warning }
      : { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line, color: theme.colors.muted };

  return (
    <View style={[styles.summaryPill, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
      <Text style={[styles.summaryText, { color: palette.color }]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: adminSpacing.md,
  },
  summaryPanel: {
    marginBottom: adminSpacing.md,
    padding: adminSpacing.md,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  bookingMeta: {
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    borderRadius: adminRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    ...adminTypography.label,
    fontSize: 12,
  },
  filterPanel: {
    gap: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: adminSpacing.sm,
    borderWidth: 1,
    borderRadius: adminRadius.md,
    minHeight: 52,
    paddingHorizontal: adminSpacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  filtersScroll: {
    paddingHorizontal: 0,
  },
  filters: {
    flexDirection: "row",
    borderRadius: adminRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  filter: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 80,
  },
  filterText: {
    fontWeight: "700",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  state: {
    marginTop: adminSpacing.lg,
  },
  error: {
    marginTop: adminSpacing.md,
    fontWeight: "500",
  },
  empty: {
    ...adminTypography.body,
    marginTop: adminSpacing.lg,
    textAlign: "center",
  },
  list: {
    marginTop: adminSpacing.md,
    gap: adminSpacing.md,
  },
  bookingCard: {
    gap: 10,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: adminSpacing.sm,
  },
  clientBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  idText: {
    ...adminTypography.label,
    fontSize: 11,
    marginLeft: 8,
    flexShrink: 1,
  },
  detailsDivider: {
    height: 1,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    ...adminTypography.body,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    borderRadius: adminRadius.md,
    borderWidth: 1,
    padding: 4,
    marginTop: adminSpacing.sm,
    alignItems: "center",
  },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: adminRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  actionDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
  },
  actionText: {
    fontWeight: "700",
    fontSize: 12,
  },
});
