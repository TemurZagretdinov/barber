import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getBarberDashboard } from "../../api/bookings";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import type { BarberStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import type { BarberDashboard } from "../../types/booking";
import { formatDateLong, formatTime, todayISO } from "../../utils/date";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const GOLD = "#C9A96E";

export function BarberDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BarberStackParamList>>();
  const { signOut, user } = useAuth();
  const [data, setData] = useState<BarberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getBarberDashboard(todayISO()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function logout() {
    await signOut();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: "Public" }] });
  }

  return (
    <ScreenContainer>
      {loading ? <ActivityIndicator color={GOLD} style={{ marginVertical: 24 }} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {data ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Xush kelibsiz,</Text>
              <Text style={styles.title}>{user?.email?.split("@")[0] ?? "Barber"}</Text>
            </View>
            <Pressable onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color={GOLD} />
            </Pressable>
          </View>

          {/* Date row */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.dateText}>{formatDateLong(todayISO())}</Text>
          </View>

          {/* Metrics grid */}
          <View style={styles.grid}>
            <MetricCard label="Bugun" value={data.today_bookings} icon="people-outline" dark />
            <MetricCard label="Tugallandi" value={data.completed_count} icon="checkmark-circle-outline" success />
            <MetricCard label="Kutilmoqda" value={data.pending_count} icon="time-outline" />
          </View>

          {/* Revenue panel */}
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Bugungi daromad</Text>
            <Text style={styles.revenueValue}>{data.today_revenue.toLocaleString()} UZS</Text>
            <View style={styles.revenueDivider} />
            <Text style={styles.revenueWeek}>
              Hafta: {data.week_revenue.toLocaleString()} UZS · {data.week_completed} ta tugallandi
            </Text>
          </View>

          {/* Schedule button */}
          <PrimaryButton
            title="Kunlik jadval"
            onPress={() => navigation.navigate("BarberSchedule")}
            icon={<Ionicons name="calendar-outline" size={18} color="#0A0A0A" />}
          />

          {/* Today's appointments */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugungi uchrashuvlar</Text>
            <Text style={styles.sectionCount}>{data.today_bookings} ta</Text>
          </View>

          <View style={styles.list}>
            {data.bookings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={32} color={colors.muted} />
                <Text style={styles.emptyText}>Bugun uchrashuvlar yo'q</Text>
              </View>
            ) : null}
            {data.bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingItem}>
                <View style={styles.bookingTime}>
                  <Text style={styles.bookingTimeText}>{formatTime(booking.time)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingClient}>{booking.customer_name}</Text>
                  <Text style={styles.bookingPhone}>{booking.customer_phone}</Text>
                </View>
                <StatusBadge status={booking.status} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

function MetricCard({
  label,
  value,
  icon,
  dark = false,
  success = false,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  dark?: boolean;
  success?: boolean;
}) {
  return (
    <View style={[
      styles.metric,
      dark && styles.metricDark,
      success && styles.metricSuccess,
    ]}>
      <Ionicons
        name={icon}
        size={22}
        color={dark ? GOLD : success ? "#10b981" : colors.muted}
      />
      <Text style={[styles.metricValue, dark && styles.metricValueDark, success && styles.metricValueSuccess]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, dark && styles.metricLabelDark]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  metricDark: {
    backgroundColor: "#1A1200",
    borderColor: "#3A2800",
  },
  metricSuccess: {
    backgroundColor: "#001A0D",
    borderColor: "#003020",
  },
  metricValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
  },
  metricValueDark: {
    color: GOLD,
  },
  metricValueSuccess: {
    color: "#10b981",
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricLabelDark: {
    color: "#888888",
  },
  revenueCard: {
    backgroundColor: "#1A1200",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#3A2800",
    padding: 18,
    gap: 6,
  },
  revenueLabel: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  revenueValue: {
    color: GOLD,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 4,
  },
  revenueWeek: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    gap: 10,
  },
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  bookingTime: {
    width: 56,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1A1200",
    borderWidth: 1,
    borderColor: "#3A2800",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bookingTimeText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "800",
  },
  bookingClient: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  bookingPhone: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0000",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
