import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ComponentProps } from "react";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { PremiumCard } from "../../components/PremiumCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;
type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function RoleSelectScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate("Public")} style={[styles.iconButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line }]}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <ThemeToggle compact />
      </View>

      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
          <Ionicons name="cut-outline" size={44} color={theme.colors.gold} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Staff Kirish</Text>
        <Text style={[styles.subtitle, { color: theme.colors.muted }]}>Qaysi panelni ochmoqchisiz?</Text>
      </View>

      <View style={styles.roles}>
        <RoleButton
          icon="cut-outline"
          title="Barber Login"
          subtitle="Kunlik jadval va bronlar"
          primary
          onPress={() => navigation.navigate("Login", { role: "barber" })}
        />
        <RoleButton
          icon="shield-checkmark-outline"
          title="Admin Login"
          subtitle="Boshqaruv paneli"
          onPress={() => navigation.navigate("Login", { role: "admin" })}
        />
      </View>

      <Text style={[styles.note, { color: theme.colors.subtle }]}>Faqat ro'yxatdan o'tgan xodimlar uchun</Text>
    </ScreenContainer>
  );
}

function RoleButton({
  icon,
  title,
  subtitle,
  onPress,
  primary = false,
}: {
  icon: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start()}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <PremiumCard
          elevated={primary}
          gold={primary}
          style={[
            styles.roleCard,
            primary && { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: primary ? theme.colors.onGold : theme.colors.goldSoft }]}>
            <Ionicons name={icon} size={26} color={primary ? theme.colors.gold : theme.colors.gold} />
          </View>
          <View style={styles.roleTextWrap}>
            <Text style={[styles.roleTitle, { color: primary ? theme.colors.onGold : theme.colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
            <Text style={[styles.roleSubtitle, { color: primary ? theme.colors.onGold : theme.colors.muted }]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={primary ? theme.colors.onGold : theme.colors.subtle} />
        </PremiumCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  roles: {
    gap: 12,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  roleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  roleSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  note: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
});
