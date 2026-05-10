import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { login } from "../../api/auth";
import { LuxuryInput } from "../../components/LuxuryInput";
import { PremiumCard } from "../../components/PremiumCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../store/authStore";
import { useTheme } from "../../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation, route }: Props) {
  const { setSession } = useAuth();
  const { theme } = useTheme();
  const role = route.params.role;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [intro]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const session = await login(email.trim(), password);
      if (session.user.role !== role) {
        throw new Error(`${role === "admin" ? "Admin" : "Barber"} huquqi kerak.`);
      }
      await setSession(session);
      navigation.reset({ index: 0, routes: [{ name: role === "admin" ? "Admin" : "Barber" }] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirish amalga oshmadi.");
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = role === "admin";

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.navigate("Public")} style={[styles.iconButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <ThemeToggle compact />
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: intro,
              transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            },
          ]}
        >
          <View style={[styles.logo, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
            <Ionicons name={isAdmin ? "shield-checkmark-outline" : "cut-outline"} size={42} color={theme.colors.gold} />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2} adjustsFontSizeToFit>
            {isAdmin ? "Admin Kirish" : "Barber Kirish"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]} numberOfLines={2} adjustsFontSizeToFit>
            {isAdmin ? "Boshqaruv paneliga xavfsiz kirish" : "Kunlik jadvalingizni oching"}
          </Text>

          <PremiumCard gold style={styles.formCard}>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
              <Ionicons name={isAdmin ? "shield-checkmark-outline" : "cut-outline"} size={14} color={theme.colors.gold} />
              <Text style={[styles.roleText, { color: theme.colors.gold }]}>{isAdmin ? "Administrator" : "Barber"}</Text>
            </View>

            {error ? (
              <View style={[styles.error, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine }]}>
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
              onPress={submit}
              loading={loading}
              disabled={!email.trim() || !password}
              icon={<Ionicons name={isAdmin ? "shield-checkmark" : "cut"} size={18} color={theme.colors.onGold} />}
            />
          </PremiumCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 16,
    paddingBottom: 20,
  },
  logo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignSelf: "center",
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
    marginTop: -8,
    paddingHorizontal: 20,
  },
  formCard: {
    gap: 14,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  roleText: {
    fontSize: 13,
    fontWeight: "800",
  },
  error: {
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
});
