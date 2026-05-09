import type { ReactNode } from "react";
import { StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";

import { adminRadius, adminSpacing, adminTypography } from "./adminTheme";
import { useTheme } from "../../theme/theme";

export function AdminPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.line, borderRadius: theme.radius.md },
        theme.shadows,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2} adjustsFontSizeToFit>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function AdminSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: adminRadius.md,
    borderWidth: 1,
    padding: adminSpacing.lg,
  },
  header: {
    marginBottom: adminSpacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: adminSpacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...adminTypography.title,
  },
  subtitle: {
    ...adminTypography.subtitle,
    marginTop: 4,
  },
  action: {
    flexShrink: 0,
  },
  sectionHeader: {
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminTypography.sectionTitle,
  },
  sectionSubtitle: {
    ...adminTypography.subtitle,
    marginTop: 3,
  },
});
