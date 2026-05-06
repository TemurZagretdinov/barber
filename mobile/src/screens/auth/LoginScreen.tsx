import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { login } from "../../api/auth";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors } from "../../components/ScreenContainer";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";

const GOLD = "#C9A96E";
const GOLD_DIM = "#C9A96E40";
const DARK_BG = "#0A0A0A";
const DARK_CARD = "#141414";
const DARK_INPUT = "#1C1C1C";
const DARK_BORDER = "#2A2A2A";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

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
      <Ionicons name={icon} size={18} color={focused ? GOLD : "#555555"} style={inp.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555555"
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        onFocus={onFocus}
        onBlur={onBlur}
        style={inp.input}
      />
      {secureTextEntry && (
        <Pressable onPress={() => setShowPassword(!showPassword)} style={inp.eyeBtn}>
          <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#555555" />
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
  icon: { marginRight: 12 },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  eyeBtn: { padding: 4, marginLeft: 8 },
});

// ─── Scissors Logo ────────────────────────────────────────────────────────────
function ScissorsLogo() {
  const glow = useRef(new Animated.Value(0.7)).current;
  const anim = useRef(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }).current;
  anim();

  return (
    <View style={logoStyle.container}>
      <Text style={logoStyle.sparkleL}>✦</Text>
      <Text style={logoStyle.sparkleR}>✦</Text>
      <Animated.View style={[logoStyle.ring, { opacity: glow }]}>
        <View style={logoStyle.cross}>
          <Ionicons name="cut" size={34} color={GOLD} style={{ transform: [{ rotate: "-40deg" }], marginRight: -8 }} />
          <Ionicons name="cut" size={26} color="#D4B483" style={{ transform: [{ rotate: "40deg" }, { scaleX: -1 }] }} />
        </View>
        <View style={logoStyle.pole} />
      </Animated.View>
    </View>
  );
}

const logoStyle = StyleSheet.create({
  container: { width: 100, height: 100, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  ring: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5, borderColor: GOLD_DIM,
    backgroundColor: "#1A1600",
    alignItems: "center", justifyContent: "center",
  },
  cross: { flexDirection: "row", alignItems: "center" },
  pole: { position: "absolute", bottom: 10, width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD },
  sparkleL: { position: "absolute", top: 8, left: 10, color: GOLD, fontSize: 10, opacity: 0.7 },
  sparkleR: { position: "absolute", top: 4, right: 8, color: GOLD, fontSize: 13, opacity: 0.5 },
});

// ─── Gold Divider ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 2 }}>
      <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_DIM }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, marginHorizontal: 8, opacity: 0.6 }} />
      <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_DIM }} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function LoginScreen({ navigation, route }: Props) {
  const { setSession } = useAuth();
  const role = route.params.role;
  const defaults = useMemo(
    () => (role === "admin" ? { email: "admin@gmail.com", password: "admin123" } : { email: "jamshid@gmail.com", password: "123456" }),
    [role],
  );
  const [email, setEmail] = useState(defaults.email);
  const [password, setPassword] = useState(defaults.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const session = await login(email.trim(), password);
      if (session.user.role !== role) {
        throw new Error(`${role === "admin" ? "Admin" : "Barber"} access required`);
      }
      await setSession(session);
      navigation.reset({ index: 0, routes: [{ name: role === "admin" ? "Admin" : "Barber" }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = role === "admin";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable onPress={() => navigation.navigate("Public")} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>

          {/* Logo */}
          <ScissorsLogo />

          {/* Title */}
          <Text style={styles.title}>
            {isAdmin ? "Admin Kirish" : "Barber Kirish"}
          </Text>
          <Text style={styles.subtitle}>
            {isAdmin ? "Boshqaruv paneliga kirish" : "Kunlik jadvalingizni ochish"}
          </Text>

          <GoldDivider />

          {/* Role badge */}
          <View style={styles.roleBadge}>
            <Ionicons
              name={isAdmin ? "shield-checkmark-outline" : "cut-outline"}
              size={14}
              color={GOLD}
            />
            <Text style={styles.roleBadgeText}>
              {isAdmin ? "Administrator" : "Barber"}
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Inputs */}
          <View style={styles.form}>
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
          <View style={styles.buttons}>
            <PrimaryButton
              title="Kirish"
              onPress={submit}
              loading={loading}
              disabled={!email.trim() || !password}
              icon={<Ionicons name={isAdmin ? "shield-checkmark" : "cut"} size={18} color="#0A0A0A" />}
            />
            <Pressable onPress={() => navigation.navigate("Public")} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Bosh sahifaga qaytish</Text>
            </Pressable>
          </View>

          <GoldDivider />

          {/* Bottom barber icons */}
          <View style={styles.decorRow}>
            <Ionicons name="brush-outline" size={24} color="#1E1E1E" />
            <Ionicons name="cut-outline" size={32} color="#1E1E1E" />
            <Ionicons name="color-wand-outline" size={24} color="#1E1E1E" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: DARK_BORDER,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
    marginTop: -6,
  },
  subtitle: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    marginTop: -10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: "#1A1200",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#3A2800",
  },
  roleBadgeText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: "700",
  },
  form: {
    gap: 14,
  },
  buttons: {
    gap: 12,
  },
  ghostBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
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
  decorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
    opacity: 0.8,
  },
});
