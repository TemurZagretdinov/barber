import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login, registerCustomer } from "../../api/auth";
import { cancelCustomerBooking, getCustomerBookingHistory, getCustomerBookings, reviewCustomerBooking } from "../../api/bookings";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import { StatusBadge } from "../../components/StatusBadge";
import type { PublicStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import type { BookingWithBarber } from "../../types/booking";
import { formatTime } from "../../utils/date";

type Props = NativeStackScreenProps<PublicStackParamList, "CustomerCabinet">;

const GOLD = "#C9A96E";
const GOLD_LIGHT = "#D4B483";
const DARK_BG = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_INPUT = "#1C1C1C";
const DARK_BORDER = "#2A2A2A";
const DARK_BORDER_GOLD = "#C9A96E55";
const TEXT_WHITE = "#FFFFFF";
const TEXT_GRAY = "#888888";
const TEXT_MUTED = "#555555";

// ─── Scissors Logo ───────────────────────────────────────────────────────────
function ScissorsLogo() {
  const spin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [])();

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={logo.container}>
      {/* Sparkles */}
      <Text style={logo.sparkleTopLeft}>✦</Text>
      <Text style={logo.sparkleTopRight}>✦</Text>
      <Animated.View style={[logo.iconWrap, { opacity: glowOpacity }]}>
        <View style={logo.crossWrap}>
          <Ionicons name="cut" size={40} color={GOLD} style={logo.icon1} />
          <Ionicons name="cut" size={32} color={GOLD_LIGHT} style={logo.icon2} />
        </View>
        {/* Barber pole dot */}
        <View style={logo.poleDot} />
      </Animated.View>
      <Text style={logo.sparkleBottomLeft}>·</Text>
      <Text style={logo.sparkleBottomRight}>·</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  container: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: DARK_BORDER_GOLD,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1600",
  },
  crossWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon1: {
    transform: [{ rotate: "-40deg" }],
    marginRight: -10,
  },
  icon2: {
    transform: [{ rotate: "40deg" }, { scaleX: -1 }],
  },
  poleDot: {
    position: "absolute",
    bottom: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  sparkleTopLeft: {
    position: "absolute",
    top: 8,
    left: 12,
    color: GOLD,
    fontSize: 10,
    opacity: 0.8,
  },
  sparkleTopRight: {
    position: "absolute",
    top: 4,
    right: 10,
    color: GOLD,
    fontSize: 14,
    opacity: 0.6,
  },
  sparkleBottomLeft: {
    position: "absolute",
    bottom: 12,
    left: 8,
    color: GOLD,
    fontSize: 18,
    opacity: 0.5,
  },
  sparkleBottomRight: {
    position: "absolute",
    bottom: 8,
    right: 6,
    color: GOLD,
    fontSize: 18,
    opacity: 0.5,
  },
});

// ─── Gold Divider ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <View style={divStyle.row}>
      <View style={divStyle.line} />
      <View style={divStyle.dot} />
      <View style={divStyle.line} />
    </View>
  );
}

const divStyle = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 0.8,
    backgroundColor: DARK_BORDER_GOLD,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GOLD,
    marginHorizontal: 8,
    opacity: 0.7,
  },
});

// ─── Dark Input ───────────────────────────────────────────────────────────────
function DarkInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "sentences";
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  }
  function onBlur() {
    setFocused(false);
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [DARK_BORDER, GOLD] });

  return (
    <Animated.View style={[inp.wrap, { borderColor }]}>
      <Ionicons name={icon} size={20} color={focused ? GOLD : TEXT_MUTED} style={inp.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={TEXT_MUTED}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={onFocus}
        onBlur={onBlur}
        style={inp.input}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setShowPassword(!showPassword)} style={inp.eyeBtn}>
          <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={TEXT_MUTED} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const inp = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK_INPUT,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 58,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

// ─── Gold Button ──────────────────────────────────────────────────────────────
function GoldButton({
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          gbtn.btn,
          disabled && gbtn.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={disabled ? "#666" : "#0A0A0A"} />
        ) : null}
        <Text style={[gbtn.text, disabled && gbtn.disabledText]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const gbtn = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  disabled: {
    backgroundColor: "#2A2A2A",
  },
  text: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  disabledText: {
    color: "#555",
  },
});

// ─── Ghost Button ─────────────────────────────────────────────────────────────
function GhostButton({
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled || loading}>
      <Animated.View style={[ghost.btn, disabled && ghost.disabled, { transform: [{ scale }] }]}>
        {loading ? (
          <ActivityIndicator color={GOLD} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={disabled ? "#555" : GOLD} />
        ) : null}
        <Text style={[ghost.text, disabled && ghost.disabledText]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const ghost = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: DARK_BORDER_GOLD,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  disabled: {
    borderColor: DARK_BORDER,
  },
  text: {
    color: TEXT_WHITE,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  disabledText: {
    color: "#555",
  },
});

// ─── Bottom Decoration ────────────────────────────────────────────────────────
function BottomDecor() {
  return (
    <View style={decor.row}>
      <Ionicons name="brush-outline" size={28} color="#1E1E1E" />
      <Ionicons name="cut-outline" size={36} color="#1E1E1E" />
      <Ionicons name="color-wand-outline" size={28} color="#1E1E1E" />
    </View>
  );
}

const decor = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
    opacity: 0.9,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function CustomerCabinetScreen({ navigation }: Props) {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<BookingWithBarber[]>([]);
  const [history, setHistory] = useState<BookingWithBarber[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const authed = auth.token && auth.user?.role === "customer";

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const [current, past] = await Promise.all([getCustomerBookings(), getCustomerBookingHistory()]);
      setBookings(current);
      setHistory(past);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submit(mode: "login" | "register") {
    setError("");
    setSubmitLoading(true);
    try {
      if (mode === "register") await registerCustomer(email, password);
      await auth.setSession(await login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth error");
    } finally {
      setSubmitLoading(false);
    }
  }

  // ─── Login View (Unauthenticated) ──────────────────────────────────────────
  if (!authed) {
    return (
      <SafeAreaView style={loginStyles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={loginStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <Pressable onPress={() => navigation.goBack()} style={loginStyles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={TEXT_WHITE} />
            </Pressable>

            {/* Logo */}
            <ScissorsLogo />

            {/* Title */}
            <Text style={loginStyles.title}>Mijoz kabineti</Text>
            <Text style={loginStyles.subtitle}>Bookinglaringizni boshqaring</Text>

            {/* Gold divider */}
            <GoldDivider />

            {/* Error banner */}
            {error ? (
              <View style={loginStyles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={loginStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={loginStyles.form}>
              <DarkInput
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <DarkInput
                icon="lock-closed-outline"
                placeholder="Parol"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Buttons */}
            <View style={loginStyles.buttons}>
              <GoldButton
                title="Kirish"
                icon="person-outline"
                onPress={() => submit("login")}
                disabled={!email.trim() || !password}
                loading={submitLoading}
              />
              <GhostButton
                title="Ro'yxatdan o'tish"
                icon="person-add-outline"
                onPress={() => submit("register")}
                disabled={!email.trim() || !password}
              />
            </View>

            {/* Bottom decoration */}
            <GoldDivider />
            <BottomDecor />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Authenticated View ────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      {/* Header */}
      <View style={authStyles.header}>
        <Pressable onPress={() => navigation.goBack()} style={authStyles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={authStyles.headerText}>
          <Text style={authStyles.title} numberOfLines={1}>Mening bronlarim</Text>
          <Text style={authStyles.subtitle} numberOfLines={1}>{auth.user?.email}</Text>
        </View>
        <Pressable onPress={auth.signOut} style={authStyles.iconBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.gold} />
        </Pressable>
      </View>

      {loading ? <ActivityIndicator color={GOLD} style={{ marginVertical: 16 }} /> : null}
      {error ? (
        <View style={authStyles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Active bookings */}
      <Text style={authStyles.sectionLabel}>Joriy bronlar</Text>
      {bookings.length === 0 && !loading ? (
        <View style={authStyles.emptyBox}>
          <Ionicons name="calendar-outline" size={36} color={colors.muted} />
          <Text style={authStyles.emptyText}>Hozircha bronlar yo'q</Text>
          <Pressable onPress={() => navigation.goBack()} style={authStyles.ctaBtn}>
            <Text style={authStyles.ctaText}>Bron qilish →</Text>
          </Pressable>
        </View>
      ) : null}
      {bookings.map((booking) => (
        <View key={booking.id} style={authStyles.bookingCard}>
          <View style={authStyles.bookingRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={authStyles.bookingTitle} numberOfLines={1}>{booking.barber_name}</Text>
              <Text style={authStyles.bookingMeta}>{booking.booking_date} · {formatTime(booking.booking_time)}</Text>
              <Text style={authStyles.bookingService} numberOfLines={1}>{booking.service_name}</Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>
          {booking.status === "pending" ? (
            <Pressable
              style={authStyles.cancelBtn}
              onPress={async () => { await cancelCustomerBooking(booking.id); await load(); }}
            >
              <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
              <Text style={authStyles.cancelText}>Bekor qilish</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {/* History */}
      <Text style={authStyles.sectionLabel}>O'tgan bronlar</Text>
      {history.slice(0, 6).map((booking) => (
        <View key={booking.id} style={[authStyles.bookingCard, authStyles.historyCard]}>
          <View style={authStyles.bookingRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={authStyles.bookingTitle} numberOfLines={1}>{booking.barber_name}</Text>
              <Text style={authStyles.bookingMeta}>{booking.booking_date}</Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>
          {booking.status === "completed" ? (
            <Pressable
              style={authStyles.rateBtn}
              onPress={async () => { await reviewCustomerBooking(booking.id, { rating: 5 }); await load(); }}
            >
              <Ionicons name="star-outline" size={15} color={GOLD} />
              <Text style={authStyles.rateText}>5 yulduz baho berish</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScreenContainer>
  );
}

// ─── Login Screen Styles ──────────────────────────────────────────────────────
const loginStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  title: {
    color: TEXT_WHITE,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: -6,
  },
  subtitle: {
    color: TEXT_GRAY,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    marginTop: -10,
  },
  form: {
    gap: 14,
  },
  buttons: {
    gap: 14,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0A0A",
    borderWidth: 1,
    borderColor: "#3A1A1A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});

// ─── Authenticated Screen Styles (Dark Luxury Theme) ─────────────────────────
const authStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  gold: {
    color: GOLD,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 8,
    marginBottom: 8,
  },
  emptyBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 28,
    backgroundColor: colors.soft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  ctaBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: GOLD,
  },
  ctaText: {
    color: "#0A0A0A",
    fontWeight: "800",
    fontSize: 14,
  },
  bookingCard: {
    borderWidth: 1,
    borderColor: DARK_BORDER_GOLD,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: DARK_CARD,
  },
  historyCard: {
    backgroundColor: "#111111",
    borderColor: DARK_BORDER,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bookingTitle: {
    color: TEXT_WHITE,
    fontSize: 15,
    fontWeight: "800",
  },
  bookingMeta: {
    color: TEXT_GRAY,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  bookingService: {
    color: GOLD_LIGHT,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#1A0000",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A1010",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 12,
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#1A1200",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3A2800",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rateText: {
    color: GOLD,
    fontWeight: "700",
    fontSize: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A0000",
    borderWidth: 1,
    borderColor: "#3A1010",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
});
