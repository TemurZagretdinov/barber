import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { createBooking } from "../../api/bookings";
import { BarberCard, barberName } from "../../components/BarberCard";
import { LuxuryInput } from "../../components/LuxuryInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ResponsiveText } from "../../components/ResponsiveText";
import { MoneyText } from "../../components/MoneyText";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import type { PublicStackParamList } from "../../navigation/types";
import { clearBookingDraft } from "../../store/bookingDraftStore";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";
import { formatDateLong, formatTime } from "../../utils/date";
import { isValidPhone } from "../../utils/phone";

type Props = NativeStackScreenProps<PublicStackParamList, "BookingDetails">;

// ─── Dark Input ───────────────────────────────────────────────────────────────
// ─── Main Screen ──────────────────────────────────────────────────────────────
export function BookingDetailsScreen({ navigation, route }: Props) {
  const { barber, service, date, time, bookingSource } = route.params;
  const auth = useAuth();
  const { theme } = useTheme();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!isValidPhone(clientPhone)) {
      setError("Telefon raqam +998 formatida bo'lishi kerak.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const booking = await createBooking({
        barber_id: barber.id,
        service_id: service.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        appointment_date: date,
        appointment_time: time,
      });
      await clearBookingDraft();
      const resolvedSource = bookingSource ?? (auth.user?.role === "customer" ? "customer" : "public");
      navigation.navigate("BookingSuccess", { booking, barberName: barberName(barber), bookingSource: resolvedSource });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking amalga oshirilmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Ma'lumotlaringiz</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Deyarli tugadi</Text>
          </View>
        </View>

        {/* Booking summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.goldDim }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.muted }]}>Bron xulosasi</Text>
          <BarberCard barber={barber} compact />
          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.line }]} />
          <View style={styles.summaryRow}>
            <Ionicons name="cut-outline" size={14} color={theme.colors.muted} />
            <ResponsiveText variant="body" color="text" numberOfLines={2} style={{ flex: 1 }}>{service.name}</ResponsiveText>
            <MoneyText amount={service.price} color="gold" compact style={{ marginLeft: 8 }} />
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.muted} />
            <Text style={[styles.summaryText, { color: theme.colors.text }]}>{formatDateLong(date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.muted} />
            <Text style={[styles.summaryText, { color: theme.colors.text }]}>{formatTime(time)}</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
            <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <LuxuryInput
            icon="person-outline"
            placeholder="To'liq ism"
            value={clientName}
            onChangeText={setClientName}
            autoCapitalize="words"
          />
          <LuxuryInput
            icon="call-outline"
            placeholder="+998901234567"
            value={clientPhone}
            onChangeText={setClientPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>

        <PrimaryButton
          title="Bronni tasdiqlash"
          onPress={submit}
          loading={loading}
          disabled={!clientName.trim() || !clientPhone.trim()}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.onGold} />}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
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
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryText: {
    fontWeight: "600",
    fontSize: 14,
    flexShrink: 1,
  },
  summaryValue: {
    fontWeight: "700",
    fontSize: 13,
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
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
});
