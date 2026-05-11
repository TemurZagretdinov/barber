import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { getBarberBalance, getBarberDashboard, getBarberTransactions, topUpBarberBalance } from "../../api/bookings";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ResponsiveText } from "../../components/ResponsiveText";
import { MoneyText } from "../../components/MoneyText";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { BarberStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";
import type { BarberDashboard } from "../../types/booking";
import type { BarberBalance, BarberTransaction } from "../../types/finance";
import { formatDateLong, todayISO } from "../../utils/date";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

const GOLD = "#C9A96E";

export function BarberDashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<BarberStackParamList>>();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState<BarberDashboard | null>(null);
  const [balance, setBalance] = useState<BarberBalance | null>(null);
  const [transactions, setTransactions] = useState<BarberTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("100000");
  const [topUpBusy, setTopUpBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextData, nextBalance, nextTransactions] = await Promise.all([
        getBarberDashboard(todayISO()),
        getBarberBalance(),
        getBarberTransactions(),
      ]);
      setData(nextData);
      setBalance(nextBalance);
      setTransactions(nextTransactions);
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

  async function submitTopUp() {
    const amount = Number(topUpAmount.replace(/\s/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Top-up miqdori musbat raqam bo'lishi kerak.");
      return;
    }
    setTopUpBusy(true);
    setError("");
    try {
      setBalance(await topUpBarberBalance(Math.round(amount)));
      setTransactions(await getBarberTransactions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up bajarilmadi");
    } finally {
      setTopUpBusy(false);
    }
  }

  function money(value: number) {
    return `${value.toLocaleString()} UZS`;
  }

  return (
    <ScreenContainer>
      {loading ? <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 24 }} /> : null}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
          <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
        </View>
      ) : null}

      {data ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: theme.colors.muted }]}>Xush kelibsiz,</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>Dashboard / Hisob</Text>
              <Text style={[styles.accountText, { color: theme.colors.subtle }]}>{user?.email?.split("@")[0] ?? "Barber"}</Text>
            </View>
            <View style={styles.headerActions}>
              <ThemeToggle compact />
              <Pressable onPress={logout} style={[styles.logoutBtn, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.gold} />
              </Pressable>
            </View>
          </View>

          {/* Date row */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.muted} />
            <Text style={[styles.dateText, { color: theme.colors.muted }]}>{formatDateLong(todayISO())}</Text>
          </View>

          {/* Metrics grid */}
          <View style={styles.grid}>
            <MetricCard label="Bugun" value={data.today_bookings} icon="people-outline" dark />
            <MetricCard label="Tugallandi" value={data.completed_count} icon="checkmark-circle-outline" success />
            <MetricCard label="Kutilmoqda" value={data.pending_count} icon="time-outline" />
          </View>

          {/* Main Account panel */}
          <View style={[styles.revenueCard, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
            <Text style={[styles.revenueLabel, { color: theme.colors.muted }]} numberOfLines={1}>Umumiy hisob</Text>
            <MoneyText amount={balance?.demo_balance ?? 0} color="gold" style={styles.revenueValue} />
            <View style={[styles.revenueDivider, { backgroundColor: theme.colors.line }]} />
            <Text style={[styles.revenueWeek, { color: theme.colors.muted }]}>
              Alpha test uchun ichki hisob-kitob
            </Text>
            <Text style={[styles.revenueWeek, { color: theme.colors.muted, marginTop: 4 }]}>
              Platforma komissiyasi: {balance?.commission_percent ?? 10}%
            </Text>
          </View>

          {balance ? (
            <View style={styles.financeBlock}>
              {balance.is_financially_blocked ? (
                <View style={[styles.warningBox, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine, flexDirection: "column", alignItems: "flex-start", gap: 6 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="alert-circle" color={theme.colors.danger} size={18} />
                    <Text style={[styles.warningTitle, { color: theme.colors.danger }]}>Hisob bloklangan</Text>
                  </View>
                  <MoneyText amount={balance.demo_debt} color="danger" style={{ fontSize: 20 }} />
                  <Text style={[styles.warningText, { color: theme.colors.danger }]}>Iltimos, balansni to'ldiring, aks holda yangi bookinglar cheklanishi mumkin.</Text>
                </View>
              ) : balance.demo_debt > 0 ? (
                <View style={[styles.warningBox, { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningLine, flexDirection: "column", alignItems: "flex-start", gap: 6 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="warning" color={theme.colors.warning} size={18} />
                    <Text style={[styles.warningTitle, { color: theme.colors.warning }]}>Qarzdorlik mavjud</Text>
                  </View>
                  <MoneyText amount={balance.demo_debt} color="warning" style={{ fontSize: 20 }} />
                  <Text style={[styles.warningText, { color: theme.colors.warning }]}>Hisobni to'ldiring, aks holda yangi bookinglar cheklanishi mumkin.</Text>
                </View>
              ) : null}

              <View style={styles.financeGrid}>
                <FinanceCard label="Bugungi tushum" value={balance.today_gross_revenue} icon="cash-outline" />
                <FinanceCard label={`Komissiya ${balance.commission_percent}%`} value={balance.today_commission} icon="receipt-outline" />
                <FinanceCard label="Sof daromad" value={balance.today_net_earning} icon="trending-up-outline" success />
                <FinanceCard label="Mijozlar" value={balance.today_completed_bookings} icon="people-outline" isCount />
              </View>

              <View style={[styles.topUpCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.line }]}>
                <Text style={[styles.topUpTitle, { color: theme.colors.text }]}>Hisobni to'ldirish</Text>
                <Text style={[styles.topUpHint, { color: theme.colors.muted }]}>Bu alpha test uchun demo to'ldirish.</Text>
                <View style={styles.topUpRow}>
                  <TextInput
                    value={topUpAmount}
                    onChangeText={setTopUpAmount}
                    keyboardType="number-pad"
                    placeholder="Summa"
                    placeholderTextColor={theme.colors.subtle}
                    style={[styles.topUpInput, { backgroundColor: theme.colors.input, borderColor: theme.colors.line, color: theme.colors.text }]}
                  />
                  <PrimaryButton
                    title={topUpBusy ? "..." : "Demo to'ldirish"}
                    onPress={submitTopUp}
                    style={styles.topUpButton}
                    size="sm"
                  />
                </View>
              </View>
            </View>
          ) : null}

          {/* Schedule button */}
          <PrimaryButton
            title="Mijozlar / Bronlar"
            onPress={() => navigation.navigate("BarberSchedule")}
            icon={<Ionicons name="people-outline" size={18} color={theme.colors.onGold} />}
          />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Demo transactionlar</Text>
            <Text style={[styles.sectionCount, { color: theme.colors.muted }]}>{transactions.length} ta</Text>
          </View>
          <View style={styles.list}>
            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={32} color={theme.colors.muted} />
                <Text style={[styles.emptyText, { color: theme.colors.muted }]}>Hali transaction yo'q</Text>
              </View>
            ) : null}
            {transactions.slice(0, 8).map((item) => (
              <View key={item.id} style={[styles.transactionItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.line }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.transactionType, { color: theme.colors.text }]}>{item.type.replace(/_/g, " ")}</Text>
                  <Text style={[styles.transactionMeta, { color: theme.colors.muted }]} numberOfLines={1}>{item.description ?? "Balance operation"}</Text>
                  <Text style={[styles.transactionMeta, { color: theme.colors.subtle }]}>
                    Balans: {money(item.balance_before)} - {money(item.balance_after)}
                  </Text>
                  <Text style={[styles.transactionMeta, { color: theme.colors.subtle }]} numberOfLines={1}>
                    Qarz: {money(item.debt_before)} - {money(item.debt_after)}
                  </Text>
                </View>
                <MoneyText amount={item.amount} color="gold" style={styles.transactionAmount} />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

function FinanceCard({
  label,
  value,
  icon,
  dark = false,
  danger = false,
  success = false,
  isCount = false,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  dark?: boolean;
  danger?: boolean;
  success?: boolean;
  isCount?: boolean;
}) {
  const { theme } = useTheme();
  const cardColors = danger
    ? { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }
    : success
      ? { backgroundColor: theme.colors.successBg, borderColor: theme.colors.successLine }
      : dark
        ? { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }
        : { backgroundColor: theme.colors.card, borderColor: theme.colors.line };
  const tint = danger ? theme.colors.danger : success ? theme.colors.success : theme.colors.gold;

  return (
    <View style={[styles.financeCard, cardColors]}>
      <Ionicons name={icon} color={tint} size={20} />
      {isCount ? (
        <Text style={[styles.financeValue, { color: dark ? theme.colors.gold : danger ? theme.colors.danger : theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>{value} ta</Text>
      ) : (
        <MoneyText amount={value} color={danger ? "danger" : dark ? "gold" : "text"} style={styles.financeValue} compact />
      )}
      <Text style={[styles.financeLabel, { color: theme.colors.muted }]} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </View>
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
  const { theme } = useTheme();
  const cardColors = success
    ? { backgroundColor: theme.colors.successBg, borderColor: theme.colors.successLine }
    : dark
      ? { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }
      : { backgroundColor: theme.colors.card, borderColor: theme.colors.line };
  const tintColor = dark ? theme.colors.gold : success ? theme.colors.success : theme.colors.muted;

  return (
    <View style={[
      styles.metric,
      dark && styles.metricDark,
      success && styles.metricSuccess,
      cardColors,
    ]}>
      <Ionicons
        name={icon}
        size={22}
        color={tintColor}
      />
      <Text style={[styles.metricValue, { color: dark ? theme.colors.gold : success ? theme.colors.success : theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: theme.colors.muted }]} numberOfLines={1} adjustsFontSizeToFit>
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
    minWidth: 0,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
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
  accountText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
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
  financeBlock: {
    gap: 12,
  },
  financeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  financeCard: {
    width: "47.5%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  financeValue: {
    fontSize: 17,
    fontWeight: "900",
  },
  financeLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  topUpCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  topUpTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  topUpHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: -4,
  },
  topUpRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  topUpInput: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "700",
  },
  topUpButton: {
    minHeight: 50,
    paddingHorizontal: 14,
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
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  transactionMeta: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: "900",
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
    borderWidth: 1,
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
