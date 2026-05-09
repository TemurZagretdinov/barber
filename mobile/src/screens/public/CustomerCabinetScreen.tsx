import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { login, registerCustomer } from "../../api/auth";
import { cancelCustomerBooking, claimCustomerBooking, getCustomerBookingHistory, getCustomerBookings, reviewCustomerBooking } from "../../api/bookings";
import { LuxuryInput } from "../../components/LuxuryInput";
import { PremiumCard } from "../../components/PremiumCard";
import { PrimaryButton, SecondaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { EmptyState, ErrorState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { PublicStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";
import type { BookingWithBarber } from "../../types/booking";
import { formatDateLong, formatTime } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "CustomerCabinet">;
type TabKey = "active" | "history" | "favorites" | "alerts";

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "active", label: "Joriy", icon: "calendar-outline" },
  { key: "history", label: "Tarix", icon: "time-outline" },
  { key: "favorites", label: "Sevimli", icon: "heart-outline" },
  { key: "alerts", label: "Xabarlar", icon: "notifications-outline" },
];

export function CustomerCabinetScreen({ navigation, route }: Props) {
  const auth = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [history, setHistory] = useState<BookingWithBarber[]>([]);
  const [tab, setTab] = useState<TabKey>("active");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [claimedCode, setClaimedCode] = useState<string | null>(null);

  const authed = Boolean(auth.token && auth.user?.role === "customer");
  const pendingClaimCode = route.params?.bookingCode;

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError("");
    try {
      if (pendingClaimCode && pendingClaimCode !== claimedCode) {
        await claimCustomerBooking(pendingClaimCode);
        setClaimedCode(pendingClaimCode);
        setTab("active");
      }
      const [current, past] = await Promise.all([getCustomerBookings(), getCustomerBookingHistory()]);
      setBookings(current);
      setHistory(past);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik.");
    } finally {
      setLoading(false);
    }
  }, [authed, claimedCode, pendingClaimCode]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submit(mode: "login" | "register") {
    setError("");
    setSubmitLoading(true);
    try {
      if (mode === "register") {
        await registerCustomer(email.trim(), password);
      }
      await auth.setSession(await login(email.trim(), password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirishda xatolik yuz berdi.");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function cancelBooking(id: number) {
    await cancelCustomerBooking(id);
    await load();
  }

  async function rateBooking(id: number) {
    await reviewCustomerBooking(id, { rating: 5 });
    await load();
  }

  if (!authed) {
    return (
      <ScreenContainer>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
            <ThemeToggle compact />
          </View>

          <View style={styles.loginHero}>
            <View style={[styles.logo, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
              <Ionicons name="person-circle-outline" size={46} color={theme.colors.gold} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Mijoz kabineti</Text>
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Bookinglaringizni boshqaring</Text>
            {pendingClaimCode ? (
              <Text style={[styles.claimHint, { color: theme.colors.gold }]}>
                {pendingClaimCode} kodi login/registerdan keyin kabinetga ulanadi.
              </Text>
            ) : null}
          </View>

          <PremiumCard gold style={styles.form}>
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
              </View>
            ) : null}
            <LuxuryInput
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <LuxuryInput
              icon="lock-closed-outline"
              placeholder="Parol"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <PrimaryButton
              title="Kirish"
              onPress={() => submit("login")}
              disabled={!email.trim() || !password}
              loading={submitLoading}
              icon={<Ionicons name="person-outline" size={18} color={theme.colors.onGold} />}
            />
            <SecondaryButton
              title="Ro'yxatdan o'tish"
              onPress={() => submit("register")}
              disabled={!email.trim() || !password}
              icon={<Ionicons name="person-add-outline" size={18} color={theme.colors.gold} />}
            />
          </PremiumCard>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.titleSmall, { color: theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            Mening bronlarim
          </Text>
          <Text style={[styles.email, { color: theme.colors.muted }]} numberOfLines={1}>
            {auth.user?.email}
          </Text>
        </View>
        <ThemeToggle compact />
        <Pressable onPress={auth.signOut} style={[styles.iconButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
          <Ionicons name="log-out-outline" size={21} color={theme.colors.gold} />
        </Pressable>
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.tab, active && { backgroundColor: theme.colors.gold }]}>
              <Ionicons name={item.icon} size={15} color={active ? theme.colors.canvas : theme.colors.muted} />
              <Text style={[styles.tabText, { color: active ? theme.colors.canvas : theme.colors.muted }]} numberOfLines={1} adjustsFontSizeToFit>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <LoadingState label="Bronlar yuklanmoqda..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && tab === "active" ? (
        <View style={styles.list}>
          {bookings.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Hozircha joriy bron yo'q"
              message="O'zingizga mos barber va vaqtni tanlab, birinchi bronni yarating."
              actionLabel="Bron qilish"
              onAction={() => navigation.navigate("ChooseBarber", { bookingSource: "customer" })}
            />
          ) : (
            bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onCancel={cancelBooking} onRate={rateBooking} />
            ))
          )}
        </View>
      ) : null}

      {!loading && !error && tab === "history" ? (
        <View style={styles.list}>
          {history.length === 0 ? (
            <EmptyState icon="time-outline" title="Tarix hali bo'sh" message="Tugallangan yoki bekor qilingan bronlar shu yerda ko'rinadi." />
          ) : (
            history.map((booking) => (
              <BookingCard key={booking.id} booking={booking} history onCancel={cancelBooking} onRate={rateBooking} />
            ))
          )}
        </View>
      ) : null}

      {!loading && !error && tab === "favorites" ? (
        <EmptyState
          icon="heart-outline"
          title="Sevimli barberlar hali yo'q"
          message="Tez orada sevimli ustalaringizni shu yerda saqlashingiz mumkin bo'ladi."
          actionLabel="Barberlarni ko'rish"
          onAction={() => navigation.navigate("ChooseBarber", { bookingSource: "customer" })}
        />
      ) : null}

      {!loading && !error && tab === "alerts" ? (
        <EmptyState
          icon="notifications-outline"
          title="Yangi xabarlar yo'q"
          message="Bron holati va eslatmalar paydo bo'lsa, shu yerda ko'rsatiladi."
        />
      ) : null}
    </ScreenContainer>
  );
}

function BookingCard({
  booking,
  history = false,
  onCancel,
  onRate,
}: {
  booking: BookingWithBarber;
  history?: boolean;
  onCancel: (id: number) => Promise<void>;
  onRate: (id: number) => Promise<void>;
}) {
  const { theme } = useTheme();
  return (
    <PremiumCard gold={!history} style={styles.bookingCard}>
      <View style={styles.bookingRow}>
        <View style={styles.bookingText}>
          <Text style={[styles.bookingTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {booking.barber_name || "Barber"}
          </Text>
          <Text style={[styles.bookingMeta, { color: theme.colors.muted }]} numberOfLines={2}>
            {formatDateLong(booking.booking_date)} · {formatTime(booking.booking_time)}
          </Text>
          {booking.service_name ? (
            <Text style={[styles.bookingService, { color: theme.colors.gold }]} numberOfLines={1}>
              {booking.service_name}
            </Text>
          ) : null}
        </View>
        <StatusBadge status={booking.status} />
      </View>
      {booking.status === "pending" ? (
        <SecondaryButton
          title="Bekor qilish"
          onPress={() => onCancel(booking.id)}
          size="sm"
          icon={<Ionicons name="close-circle-outline" size={16} color={theme.colors.danger} />}
        />
      ) : null}
      {booking.status === "completed" ? (
        <SecondaryButton
          title="5 yulduz baho berish"
          onPress={() => onRate(booking.id)}
          size="sm"
          icon={<Ionicons name="star-outline" size={16} color={theme.colors.gold} />}
        />
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  loginHero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  claimHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  form: {
    gap: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  titleSmall: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
  },
  email: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 3,
  },
  tabText: {
    fontSize: 11,
    fontWeight: "800",
  },
  list: {
    gap: 12,
  },
  bookingCard: {
    gap: 12,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bookingText: {
    flex: 1,
    minWidth: 0,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  bookingMeta: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 3,
  },
  bookingService: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
});
