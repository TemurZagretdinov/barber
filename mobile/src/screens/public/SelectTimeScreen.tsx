import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getAvailableSlots } from "../../api/barbers";
import { BarberCard, barberName } from "../../components/BarberCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { TimeSlotButton } from "../../components/TimeSlotButton";
import type { PublicStackParamList } from "../../navigation/types";
import { saveBookingDraft } from "../../store/bookingDraftStore";
import type { AvailableSlot } from "../../types/barber";
import { formatDateLong, nextDates } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "SelectTime">;

export function SelectTimeScreen({ navigation, route }: Props) {
  const { barber, service } = route.params;
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
      setSlots(slotData);
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
    await saveBookingDraft({ barberId, serviceId: service.id, date, time: selectedTime });
    navigation.navigate("BookingDetails", { barber, service, date, time: selectedTime });
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Vaqt tanlash</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{barberName(barber)}</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.gold} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}><Text style={{ color: colors.gold, fontWeight: "700", fontSize: 12 }}>Retry</Text></Pressable>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.content}>
          {/* Barber compact */}
          <BarberCard barber={barber} compact />

          {/* Service summary */}
          <View style={styles.serviceBox}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="cut-outline" size={18} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceMeta}>
                {Math.round(service.price).toLocaleString("uz-UZ")} so'm · {service.duration_minutes} min
              </Text>
            </View>
          </View>

          {/* Date selector */}
          <Text style={styles.sectionTitle}>Sana tanlash</Text>
          <View style={styles.dateRow}>
            {nextDates().map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setDate(item.value)}
                style={[styles.dateButton, date === item.value && styles.dateButtonActive]}
              >
                <Text style={[styles.dateText, date === item.value && styles.dateTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.dateLabel}>{formatDateLong(date)}</Text>

          {/* Time slots */}
          <Text style={styles.sectionTitle}>Bo'sh vaqtlar</Text>
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
            <LegendDot color={colors.gold} label="Tanlangan" />
            <LegendDot color="#1C1C1C" label="Bo'sh" />
            <LegendDot color="#141414" label="Band" />
          </View>

          {slots.length === 0 || !slots.some((s) => s.is_available) ? (
            <View style={styles.emptyBox}>
              <Ionicons name="time-outline" size={30} color={colors.muted} />
              <Text style={styles.emptyText}>Bu kunda bo'sh vaqt yo'q</Text>
            </View>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, borderColor: color === "#1C1C1C" ? "#2A2A2A" : color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
