import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { createBooking } from "../../api/bookings";
import { BarberCard, barberName } from "../../components/BarberCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import type { PublicStackParamList } from "../../navigation/types";
import { clearBookingDraft } from "../../store/bookingDraftStore";
import { formatDateLong, formatTime } from "../../utils/date";
import { isValidPhone } from "../../utils/phone";

type Props = NativeStackScreenProps<PublicStackParamList, "BookingDetails">;

// ─── Dark Input ───────────────────────────────────────────────────────────────
function DarkInput({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "email-address" | "default" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocused(false);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: ["#2A2A2A", colors.gold] });

  return (
    <Animated.View style={[inp.wrap, { borderColor }]}>
      <Ionicons name={icon} size={18} color={focused ? colors.gold : "#555555"} style={inp.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555555"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={onFocus}
        onBlur={onBlur}
        style={inp.input}
      />
    </Animated.View>
  );
}

const inp = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function BookingDetailsScreen({ navigation, route }: Props) {
  const { barber, service, date, time } = route.params;
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
      navigation.navigate("BookingSuccess", { booking, barberName: barberName(barber) });
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
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Ma'lumotlaringiz</Text>
            <Text style={styles.subtitle}>Deyarli tugadi</Text>
          </View>
        </View>

        {/* Booking summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Bron xulosasi</Text>
          <BarberCard barber={barber} compact />
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Ionicons name="cut-outline" size={14} color={colors.muted} />
            <Text style={styles.summaryText}>{service.name}</Text>
            <Text style={styles.summaryValue}>{Math.round(service.price).toLocaleString()} so'm</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.summaryText}>{formatDateLong(date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.summaryText}>{formatTime(time)}</Text>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <DarkInput
            icon="person-outline"
            placeholder="To'liq ism"
            value={clientName}
            onChangeText={setClientName}
            autoCapitalize="words"
          />
          <DarkInput
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
          icon={<Ionicons name="checkmark-circle-outline" size={20} color="#0A0A0A" />}
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
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
  summaryValue: {
    color: colors.gold,
    fontWeight: "700",
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
