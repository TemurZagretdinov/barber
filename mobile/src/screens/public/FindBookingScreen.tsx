import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { findBooking } from "../../api/bookings";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import type { PublicStackParamList } from "../../navigation/types";
import type { Booking } from "../../types/booking";
import { formatDateLong, formatTime } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "FindBooking">;

export function FindBookingScreen({ navigation }: Props) {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function submit() {
    setLoading(true);
    setError("");
    setBooking(null);
    try {
      setBooking(await findBooking(code.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking topilmadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.title}>Bron qidirish</Text>
          <Text style={styles.subtitle}>Bron kodingizni kiriting</Text>
        </View>
      </View>

      {/* Search input */}
      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <Ionicons name="search-outline" size={18} color={focused ? colors.gold : "#555555"} style={{ marginRight: 12 }} />
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="BKG-000001"
          style={styles.input}
          placeholderTextColor="#555555"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {code.length > 0 && (
          <Pressable onPress={() => setCode("")}>
            <Ionicons name="close-circle" size={18} color="#555555" />
          </Pressable>
        )}
      </Animated.View>

      <PrimaryButton
        title="Qidirish"
        onPress={submit}
        loading={loading}
        disabled={!code.trim()}
        icon={<Ionicons name="search-outline" size={18} color="#0A0A0A" />}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {booking ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Bron ma'lumotlari</Text>
          <View style={styles.divider} />
          <ResultRow icon="bookmark-outline" label="Kod" value={booking.booking_code ?? `#${booking.id}`} gold />
          <ResultRow icon="person-outline" label="Ism" value={booking.client_name} />
          <ResultRow icon="call-outline" label="Telefon" value={booking.client_phone} />
          <ResultRow icon="calendar-outline" label="Sana" value={formatDateLong(booking.booking_date)} />
          <ResultRow icon="time-outline" label="Vaqt" value={formatTime(booking.booking_time)} />
          <StatusBadge status={booking.status} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function ResultRow({
  icon,
  label,
  value,
  gold = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Ionicons name={icon} size={14} color={colors.muted} />
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, gold && styles.goldValue]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0000",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.soft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.goldDim,
    padding: 20,
    gap: 10,
    marginTop: 18,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    width: 60,
  },
  resultValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  goldValue: {
    color: colors.gold,
  },
});
