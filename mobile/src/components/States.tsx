import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "./PrimaryButton";
import { PremiumCard } from "./PremiumCard";
import { useTheme } from "../theme/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function LoadingState({ label = "Yuklanmoqda..." }: { label?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={theme.colors.gold} />
      <Text style={[styles.text, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = "sparkles-outline",
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  icon?: IoniconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <PremiumCard style={styles.card}>
      <Ionicons name={icon} size={34} color={theme.colors.gold} />
      <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2} adjustsFontSizeToFit>
        {title}
      </Text>
      {message ? <Text style={[styles.text, { color: theme.colors.muted }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton title={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      ) : null}
    </PremiumCard>
  );
}

export function ErrorState({
  title = "Xatolik yuz berdi",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <PremiumCard style={[styles.card, { borderColor: theme.colors.dangerLine, backgroundColor: theme.colors.dangerBg }]}>
      <Ionicons name="alert-circle-outline" size={28} color={theme.colors.danger} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.text, { color: theme.colors.muted }]}>{message}</Text>
      {onRetry ? <PrimaryButton title="Qayta urinish" onPress={onRetry} variant="ghost" size="sm" style={styles.action} /> : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 28,
  },
  card: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 28,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    textAlign: "center",
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    textAlign: "center",
  },
  action: {
    marginTop: 4,
    alignSelf: "stretch",
  },
});
