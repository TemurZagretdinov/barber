import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAdminDashboard } from "../../api/bookings";
import { AdminPageHeader, AdminPanel, AdminSectionHeader } from "../../components/admin/AdminPanel";
import { adminColors, adminSpacing, adminTypography } from "../../components/admin/adminTheme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";
import type { AdminDashboard } from "../../types/booking";
import { formatDateLong, todayISO } from "../../utils/date";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const GOLD = "#C9A96E";

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAdminDashboard());
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
    navigation.reset({ index: 0, routes: [{ name: "Public" }] });
  }

  return (
    <ScreenContainer>
      <AdminPageHeader
        title="Dashboard"
        subtitle={`${formatDateLong(todayISO())} — Umumiy ko'rinish`}
        action={
          <View style={styles.headerActions}>
            <ThemeToggle compact />
            <PrimaryButton
              title="Chiqish"
              onPress={logout}
              variant="ghost"
              icon={<Ionicons name="log-out-outline" color={theme.colors.gold} size={18} />}
              style={styles.logoutButton}
            />
          </View>
        }
      />
      {loading ? <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 16 }} /> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      {data ? (
        <View style={styles.content}>
          {/* Stats grid */}
          <View style={styles.grid}>
            <StatCard
              label="Barberlar"
              hint="ro'yxatdagi"
              value={data.total_barbers}
              icon={<Ionicons name="people-outline" color={theme.colors.gold} size={22} />}
              dark
            />
            <StatCard
              label="Faol"
              hint="barberlar"
              value={data.active_barbers}
              icon={<Ionicons name="cut" color={theme.colors.muted} size={22} />}
            />
            <StatCard
              label="Bugun"
              hint="bronlar"
              value={data.today_bookings}
              icon={<Ionicons name="calendar" color={theme.colors.gold} size={22} />}
              tint="warning"
            />
            <StatCard
              label="Tugallandi"
              hint="jami"
              value={data.completed_bookings}
              icon={<Ionicons name="checkmark-circle" color={theme.colors.success} size={22} />}
              tint="success"
            />
          </View>

          {/* Top barbers */}
          <AdminPanel>
            <AdminSectionHeader title="Top barberlar" subtitle="Bron va tushum bo'yicha" />
            <View style={styles.performanceList}>
              {data.top_barbers.map((item) => {
                const progress = item.bookings_count ? item.completed_count / item.bookings_count : 0;
                return (
                  <View key={item.id} style={styles.progressItem}>
                    <View style={styles.progressHeader}>
                      <Text style={[styles.progressName, { color: theme.colors.text }]} numberOfLines={1}>{item.full_name}</Text>
                      <Text style={[styles.progressCount, { color: theme.colors.muted }]}>{item.completed_count}/{item.bookings_count}</Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: theme.colors.elevated }]}>
                      <View style={[styles.trackFill, { backgroundColor: theme.colors.gold, width: `${Math.min(progress * 100, 100)}%` }]} />
                    </View>
                    <Text style={[styles.revenueMeta, { color: theme.colors.muted }]}>{item.revenue.toLocaleString()} UZS</Text>
                  </View>
                );
              })}
              {data.top_barbers.length === 0 ? (
                <Text style={[styles.empty, { color: theme.colors.muted }]}>Hali bronlar yo'q</Text>
              ) : null}
            </View>
          </AdminPanel>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  dark = false,
  tint,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  dark?: boolean;
  tint?: "success" | "warning";
}) {
  const { theme } = useTheme();
  const cardColors = tint === "success"
    ? { backgroundColor: theme.colors.successBg, borderColor: theme.colors.successLine }
    : tint === "warning" || dark
      ? { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }
      : { backgroundColor: theme.colors.card, borderColor: theme.colors.line };
  const valueColor = tint === "success" ? theme.colors.success : dark || tint === "warning" ? theme.colors.gold : theme.colors.text;

  return (
    <AdminPanel style={[
      styles.statCard,
      dark && styles.darkCard,
      tint === "success" && styles.successCard,
      tint === "warning" && styles.warningCard,
      cardColors,
    ]}>
      {icon}
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.muted }]}>{label}</Text>
      <Text style={[styles.statHint, { color: theme.colors.subtle }]}>{hint}</Text>
    </AdminPanel>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  content: {
    gap: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: adminSpacing.md,
  },
  statCard: {
    width: "47.5%",
    minHeight: 148,
    gap: adminSpacing.sm,
  },
  darkCard: {
    backgroundColor: "#1A1200",
    borderColor: "#3A2800",
  },
  successCard: {
    backgroundColor: "#001A0D",
    borderColor: "#003020",
  },
  warningCard: {
    backgroundColor: "#1A1000",
    borderColor: "#3A2800",
  },
  statValue: {
    color: adminColors.text,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  statLabel: {
    ...adminTypography.subtitle,
    color: "#888888",
  },
  statHint: {
    ...adminTypography.label,
    color: "#666666",
  },
  darkText: {
    color: GOLD,
  },
  darkMuted: {
    color: "#888888",
  },
  error: {
    color: adminColors.danger,
    marginBottom: adminSpacing.md,
    fontWeight: "500",
  },
  performanceList: {
    gap: adminSpacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  progressItem: {
    gap: 4,
  },
  progressName: {
    ...adminTypography.body,
    flex: 1,
    fontWeight: "600",
    color: adminColors.text,
  },
  progressCount: {
    ...adminTypography.body,
    color: adminColors.muted,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1C1C1C",
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  revenueMeta: {
    ...adminTypography.body,
    color: adminColors.muted,
    marginTop: 2,
    fontSize: 12,
  },
  empty: {
    ...adminTypography.body,
    color: adminColors.muted,
    textAlign: "center",
    paddingVertical: adminSpacing.md,
  },
});
