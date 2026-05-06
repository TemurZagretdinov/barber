import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../components/ScreenContainer";
import type { RootStackParamList } from "../../navigation/types";

const GOLD = "#C9A96E";
const GOLD_DIM = "#C9A96E40";
const DARK_BG = "#0A0A0A";
const DARK_BORDER = "#2A2A2A";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;

// ─── Animated Role Button ─────────────────────────────────────────────────────
function RoleButton({
  icon,
  title,
  subtitle,
  onPress,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[styles.roleCard, primary && styles.roleCardPrimary, { transform: [{ scale }] }]}>
        <View style={[styles.roleIcon, primary && styles.roleIconPrimary]}>
          <Ionicons name={icon} size={28} color={primary ? "#0A0A0A" : GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleTitle, primary && styles.roleTitlePrimary]}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={primary ? "#0A0A0A" : "#555555"} />
      </Animated.View>
    </Pressable>
  );
}

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
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}>
      <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_DIM }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD, marginHorizontal: 8, opacity: 0.6 }} />
      <View style={{ flex: 1, height: 0.8, backgroundColor: GOLD_DIM }} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function RoleSelectScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
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
        <Text style={styles.title}>Staff Kirish</Text>
        <Text style={styles.subtitle}>Qaysi panelni ochmoqchisiz?</Text>

        <GoldDivider />

        {/* Role cards */}
        <View style={styles.roles}>
          <RoleButton
            icon="cut-outline"
            title="Barber Login"
            subtitle="Kunlik jadval va bronlar"
            onPress={() => navigation.navigate("Login", { role: "barber" })}
            primary
          />
          <RoleButton
            icon="shield-checkmark-outline"
            title="Admin Login"
            subtitle="Boshqaruv paneli"
            onPress={() => navigation.navigate("Login", { role: "admin" })}
          />
        </View>

        <GoldDivider />

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Faqat ro'yxatdan o'tgan xodimlar uchun
        </Text>

        {/* Bottom decoration */}
        <View style={styles.decorRow}>
          <Ionicons name="brush-outline" size={24} color="#1E1E1E" />
          <Ionicons name="cut-outline" size={32} color="#1E1E1E" />
          <Ionicons name="color-wand-outline" size={24} color="#1E1E1E" />
        </View>
      </ScrollView>
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
    gap: 20,
    justifyContent: "center",
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
    fontSize: 30,
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
  roles: {
    gap: 14,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DARK_BORDER,
    padding: 18,
  },
  roleCardPrimary: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1A1200",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3A2800",
  },
  roleIconPrimary: {
    backgroundColor: "#0A0A0A",
    borderColor: "rgba(0,0,0,0.2)",
  },
  roleTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  roleTitlePrimary: {
    color: "#0A0A0A",
  },
  roleSubtitle: {
    color: "#888888",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "500",
  },
  footerNote: {
    color: "#444444",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  decorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
    opacity: 0.8,
  },
});
