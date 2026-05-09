import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { cancelBarberBooking, completeBarberBookingWithNote, getBarberSchedule, noShowBarberBooking } from "../../api/bookings";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import type { BarberStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import type { BookingStatus, BookingWithBarber } from "../../types/booking";
import { addDays, formatDateLong, formatTime, todayISO } from "../../utils/date";

const GOLD = "#C9A96E";
const GOLD_DIM = "#C9A96E40";

const filters = ["all", "pending", "completed", "cancelled", "no_show"] as const;
const filterLabels: Record<string, string> = {
  all: "Barchasi",
  pending: "Kutilmoqda",
  completed: "Tugallandi",
  cancelled: "Bekor",
  no_show: "Kelmadi",
};
type ActionKind = "complete" | "no_show" | "cancel";

type Props = NativeStackScreenProps<BarberStackParamList, "BarberSchedule">;

export function BarberScheduleScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [date, setDate] = useState(todayISO());
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<{ kind: ActionKind; booking: BookingWithBarber } | null>(null);
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookings(await getBarberSchedule({ date, status: filter === "all" ? undefined : filter }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load schedule");
    } finally {
      setLoading(false);
    }
  }, [date, filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function confirmAction() {
    if (!action || actionLoading) return;
    setActionLoading(true);
    setActionError("");
    try {
      if (action.kind === "complete") await completeBarberBookingWithNote(action.booking.id, note);
      if (action.kind === "no_show") await noShowBarberBooking(action.booking.id, note);
      if (action.kind === "cancel") await cancelBarberBooking(action.booking.id, note);
      setAction(null);
      setNote("");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Amalni bajarib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.roundButton, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Kunlik jadval</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Barcha uchrashuvlar</Text>
        </View>
      </View>

      {/* Date navigation */}
      <View style={[styles.dateNav, { backgroundColor: theme.colors.card, borderColor: theme.colors.line }]}>
        <Pressable onPress={() => setDate(addDays(date, -1))} style={[styles.roundButton, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDateLong(date)}</Text>
          <Text style={[styles.dateISO, { color: theme.colors.muted }]}>{date}</Text>
        </View>
        <Pressable onPress={() => setDate(addDays(date, 1))} style={[styles.roundButton, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filterChip,
              { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line },
              filter === item && { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === item ? theme.colors.onGold : theme.colors.muted }]}>
              {filterLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 20 }} /> : null}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
          <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      ) : null}
      {!loading && bookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={36} color={theme.colors.muted} />
          <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Bu kunda uchrashuvlar yo'q</Text>
        </View>
      ) : null}

      {/* Bookings */}
      <View style={styles.list}>
        {bookings.map((booking) => (
          <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.line }]}>
            <View style={styles.bookingRow}>
              <View style={[styles.timeTag, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
                <Text style={[styles.timeTagText, { color: theme.colors.gold }]}>{formatTime(booking.booking_time)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clientName, { color: theme.colors.text }]}>{booking.client_name}</Text>
                <Text style={[styles.clientPhone, { color: theme.colors.muted }]}>{booking.client_phone}</Text>
              </View>
              <StatusBadge status={booking.status as BookingStatus} />
            </View>
            {booking.service_note ? (
              <Text style={[styles.serviceNote, { backgroundColor: theme.colors.elevated, color: theme.colors.muted }]}>{booking.service_note}</Text>
            ) : null}
            {booking.status === "pending" ? (
              <View style={styles.actionsRow}>
                <PrimaryButton
                  title="Tugallash"
                  onPress={() => { setActionError(""); setAction({ kind: "complete", booking }); }}
                  icon={<Ionicons name="checkmark-circle" size={16} color={theme.colors.onGold} />}
                  style={styles.actionBtn}
                />
                <PrimaryButton
                  title="Kelmadi"
                  onPress={() => { setActionError(""); setAction({ kind: "no_show", booking }); }}
                  variant="ghost"
                  style={styles.actionBtn}
                />
                <PrimaryButton
                  title="Bekor"
                  onPress={() => { setActionError(""); setAction({ kind: "cancel", booking }); }}
                  variant="ghost"
                  style={styles.actionBtn}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Action modal */}
      <Modal transparent visible={!!action} animationType="fade" onRequestClose={() => setAction(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.goldDim }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {action?.kind === "complete"
                ? "Tugallanganligini tasdiqlash"
                : action?.kind === "no_show"
                  ? "Kelmadi deb belgilash"
                  : "Bronni bekor qilish"}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={action?.kind === "complete" ? "Xizmat izohi (ixtiyoriy)" : "Izoh (ixtiyoriy)"}
              placeholderTextColor={theme.colors.subtle}
              multiline
              style={[styles.noteInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.line, color: theme.colors.text }]}
              editable={!actionLoading}
            />
            {actionError ? (
              <View style={[styles.modalError, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
                <Ionicons name="alert-circle-outline" size={15} color={theme.colors.danger} />
                <Text style={[styles.modalErrorText, { color: theme.colors.danger }]}>{actionError}</Text>
              </View>
            ) : null}
            <View style={styles.actionsRow}>
              <PrimaryButton
                title="Bekor"
                onPress={() => { setAction(null); setActionError(""); }}
                variant="ghost"
                disabled={actionLoading}
                style={styles.actionBtn}
              />
              <PrimaryButton title="Tasdiqlash" onPress={confirmAction} loading={actionLoading} disabled={actionLoading} style={styles.actionBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
  },
  dateText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  dateISO: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: "#0A0A0A",
  },
  list: {
    gap: 12,
    marginTop: 4,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 12,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeTag: {
    width: 52,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1A1200",
    borderWidth: 1,
    borderColor: "#3A2800",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timeTagText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "800",
  },
  clientName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  clientPhone: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  serviceNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: colors.soft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0000",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#141414",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_DIM,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  noteInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    textAlignVertical: "top",
    backgroundColor: "#1C1C1C",
    fontSize: 14,
  },
  modalError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalErrorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});
