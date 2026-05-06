import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import type { PublicStackParamList } from "../../navigation/types";
import { formatDateLong, formatTime } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "BookingSuccess">;

export function BookingSuccessScreen({ navigation, route }: Props) {
  const { booking, barberName } = route.params;
  const bookingDate = booking.appointment_date ?? booking.booking_date;
  const bookingTime = booking.appointment_time ?? booking.booking_time;

  const pulseAnim = useRef(new Animated.Value(0.9)).current;

  // Entrance animation
  useRef(() => {
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 8 }).start();
  }).current?.();

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        {/* Gold success ring */}
        <Animated.View style={[styles.successRing, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.successInner}>
            <Ionicons name="checkmark" size={40} color="#0A0A0A" />
          </View>
        </Animated.View>

        <Text style={styles.title}>Bron tasdiqlandi!</Text>
        <Text style={styles.subtitle}>Sizning uchrashuvingiz saqlandi.</Text>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.codeLabel}>Bron kodi</Text>
          <Text style={styles.code}>{booking.booking_code ?? `#${booking.id}`}</Text>
          <View style={styles.divider} />
          <InfoRow icon="person-outline" label="Barber" value={barberName} />
          <InfoRow icon="calendar-outline" label="Sana" value={formatDateLong(bookingDate)} />
          <InfoRow icon="time-outline" label="Vaqt" value={formatTime(bookingTime)} />
          {(booking as any).service_note || (booking as any).service_name ? (
            <InfoRow icon="cut-outline" label="Xizmat" value={(booking as any).service_note || (booking as any).service_name} />
          ) : null}
        </View>

        <PrimaryButton
          title="Bosh sahifaga qaytish"
          onPress={() => navigation.popToTop()}
          icon={<Ionicons name="home-outline" size={18} color="#0A0A0A" />}
          style={{ width: "100%" }}
        />
      </View>
    </ScreenContainer>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 40,
  },
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.goldDim,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1200",
  },
  successInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    marginTop: -10,
  },
  infoCard: {
    width: "100%",
    backgroundColor: colors.soft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 20,
    gap: 10,
  },
  codeLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  code: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    width: 60,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
});
