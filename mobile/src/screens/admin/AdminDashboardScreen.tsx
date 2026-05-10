import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { getAdminDashboard, getAdminFinanceOverview, runAdminSettlement } from "../../api/bookings";
import { AdminPageHeader, AdminPanel, AdminSectionHeader } from "../../components/admin/AdminPanel";
import { adminColors, adminSpacing, adminTypography } from "../../components/admin/adminTheme";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ResponsiveText } from "../../components/ResponsiveText";
import { MoneyText } from "../../components/MoneyText";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";
import type { AdminDashboard } from "../../types/booking";
import type { AdminFinanceOverview } from "../../types/finance";
import { formatDateLong, todayISO } from "../../utils/date";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const GOLD = "#C9A96E";

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [finance, setFinance] = useState<AdminFinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlementBusy, setSettlementBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextData, nextFinance] = await Promise.all([getAdminDashboard(), getAdminFinanceOverview()]);
      setData(nextData);
      setFinance(nextFinance);
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

  async function runSettlement() {
    setSettlementBusy(true);
    setError("");
    try {
      await runAdminSettlement(todayISO());
      const nextFinance = await getAdminFinanceOverview();
      setFinance(nextFinance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement failed");
    } finally {
      setSettlementBusy(false);
    }
  }

  function money(value: number) {
    return `${value.toLocaleString()} UZS`;
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

          {finance ? (
            <AdminPanel style={styles.financePanel}>
              <View style={styles.financeHeader}>
                <AdminSectionHeader title="Finance" subtitle="Komissiya va qarzdorlik" />
                <PrimaryButton
                  title={settlementBusy ? "..." : "Settle"}
                  onPress={runSettlement}
                  style={styles.settleButton}
                  icon={<Ionicons name="play-circle-outline" color={theme.colors.onGold} size={18} />}
                />
              </View>
              <View style={styles.financeGrid}>
                <FinanceMetric label="Bugun" value={finance.total_platform_commission_today} icon="receipt-outline" />
                <FinanceMetric label="Oy" value={finance.total_platform_commission_month} icon="trending-up-outline" />
                <FinanceMetric label="Qarz" value={finance.total_barber_debt} icon="wallet-outline" danger={finance.total_barber_debt > 0} />
                <FinanceMetric label="Unsettled" value={finance.unsettled_commissions} icon="hourglass-outline" />
              </View>
              {finance.barbers_with_debt.length > 0 ? (
                <View style={styles.debtList}>
                  {finance.barbers_with_debt.slice(0, 5).map((item) => (
                    <View key={item.barber_id} style={[styles.debtRow, { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningLine }]}>
                      <Text style={[styles.debtName, { color: theme.colors.text }]} numberOfLines={2}>{item.full_name}</Text>
                      <MoneyText amount={item.demo_debt} color="warning" compact />
                    </View>
                  ))}
                </View>
              ) : null}
            </AdminPanel>
          ) : null}

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
                    <MoneyText amount={item.revenue} color="muted" style={styles.revenueMeta} />
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

function FinanceMetric({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.financeMetric, { backgroundColor: danger ? theme.colors.dangerBg : theme.colors.card, borderColor: danger ? theme.colors.dangerLine : theme.colors.line }]}>
      <Ionicons name={icon} color={danger ? theme.colors.danger : theme.colors.gold} size={20} />
      <MoneyText amount={value} color={danger ? "danger" : "text"} style={styles.financeValue} compact />
      <Text style={[styles.financeLabel, { color: theme.colors.muted }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
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
  financePanel: {
    gap: adminSpacing.md,
  },
  financeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: adminSpacing.md,
    alignItems: "center",
  },
  settleButton: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  financeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: adminSpacing.sm,
  },
  financeMetric: {
    width: "47.5%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 7,
  },
  financeValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  financeLabel: {
    ...adminTypography.label,
  },
  debtList: {
    gap: 8,
  },
  debtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: adminSpacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  debtName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  debtAmount: {
    fontSize: 13,
    fontWeight: "800",
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
