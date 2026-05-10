import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getAvailableSlots } from "../../api/barbers";
import { BarberCard, barberName } from "../../components/BarberCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ResponsiveText } from "../../components/ResponsiveText";
import { MoneyText } from "../../components/MoneyText";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState } from "../../components/States";
import { TimeSlotButton } from "../../components/TimeSlotButton";
import type { PublicStackParamList } from "../../navigation/types";
import { saveBookingDraft } from "../../store/bookingDraftStore";
import { useTheme } from "../../theme/theme";
import type { AvailableSlot } from "../../types/barber";
import { formatDateLong, nextDates, todayISO } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "SelectTime">;

export function SelectTimeScreen({ navigation, route }: Props) {
  const { barber, service, bookingSource } = route.params;
  const { theme } = useTheme();
  const barberId = Number(route.params.barberId ?? barber?.id);
  const [date, setDate] = useState(nextDates()[0].value);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedTime(null);
    try {
      if (!Number.isFinite(barberId)) {
        throw new Error("Barber ID noto'g'ri. Iltimos qaytadan barber tanlang.");
      }
      const slotData = await getAvailableSlots(barberId, date, service.id);
      setSlots(slotData.map((slot) => markPastSlot(slot, date)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load time slots");
    } finally {
      setLoading(false);
    }
  }, [barberId, date, service.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function continueBooking() {
    if (!selectedTime) return;
    await saveBookingDraft({ barberId, serviceId: service.id, date, time: selectedTime, bookingSource });
    navigation.navigate("BookingDetails", { barber, service, date, time: selectedTime, bookingSource });
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Vaqt tanlash</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]} numberOfLines={1}>{barberName(barber)}</Text>
        </View>
      </View>

      {loading ? <LoadingState label="Vaqtlar yuklanmoqda..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <View style={styles.content}>
          {/* Barber compact */}
          <BarberCard barber={barber} compact />

          {/* Service summary */}
          <View style={[styles.serviceBox, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
            <View style={[styles.serviceIconWrap, { backgroundColor: theme.colors.gold }]}>
              <Ionicons name="cut-outline" size={18} color={theme.colors.onGold} />
            </View>
            <View style={{ flex: 1 }}>
              <ResponsiveText variant="body" color="text" numberOfLines={2} style={{ fontWeight: "800" }}>{service.name}</ResponsiveText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                 <MoneyText amount={service.price} color="gold" compact style={{ fontSize: 13 }} />
                 <Text style={{ color: theme.colors.gold, fontSize: 13, fontWeight: "700" }}>· {service.duration_minutes} min</Text>
              </View>
            </View>
          </View>

          {/* Date selector */}
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>Sana tanlash</Text>
          <View style={styles.dateRow}>
            {nextDates().map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setDate(item.value)}
                style={[
                  styles.dateButton,
                  { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line },
                  date === item.value && { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
                ]}
              >
                <Text style={[styles.dateText, { color: date === item.value ? theme.colors.onGold : theme.colors.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.dateLabel, { color: theme.colors.muted }]}>{formatDateLong(date)}</Text>

          {/* Time slots */}
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>Bo'sh vaqtlar</Text>
          <View style={styles.slotGrid}>
            {slots.map((slot, index) => (
              <TimeSlotButton
                key={`${slot.time}-${index}`}
                slot={slot}
                selected={selectedTime === slot.time}
                onPress={() => setSelectedTime(slot.time)}
              />
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendDot color={theme.colors.gold} borderColor={theme.colors.gold} label="Tanlangan" />
            <LegendDot color={theme.colors.elevated} borderColor={theme.colors.line} label="Bo'sh" />
            <LegendDot color={theme.colors.card} borderColor={theme.colors.line} label="Band" />
          </View>

          {slots.length === 0 || !slots.some((s) => s.is_available) ? (
            <EmptyState icon="time-outline" title="Bu kunda bo'sh vaqt yo'q" message="Boshqa sana tanlab ko'ring." />
          ) : null}

          <PrimaryButton
            title={selectedTime ? "Davom etish" : "Vaqt tanlang"}
            onPress={continueBooking}
            disabled={!selectedTime}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function markPastSlot(slot: AvailableSlot, date: string): AvailableSlot {
  if (date !== todayISO()) {
    return slot;
  }

  const [hour, minute] = slot.time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return slot;
  }

  const slotDate = new Date();
  slotDate.setHours(hour, minute, 0, 0);
  const expired = slotDate.getTime() <= Date.now();

  return expired ? { ...slot, is_available: false, is_expired: true } : slot;
}

function LegendDot({ color, borderColor, label }: { color: string; borderColor: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderColor }]} />
      <Text style={[styles.legendText, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  backButton: {
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
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 13,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0000",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  content: {
    gap: 16,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  dateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateButton: {
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dateText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  dateTextActive: {
    color: "#0A0A0A",
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: -6,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  legendText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  serviceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serviceName: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15,
  },
  serviceMeta: {
    color: colors.gold,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 2,
  },
});
