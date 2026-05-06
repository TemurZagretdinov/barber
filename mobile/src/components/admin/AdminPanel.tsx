import type { ReactNode } from "react";
import { StyleSheet, Text, View, StyleProp, ViewStyle } from "react-native";

import { adminColors, adminRadius, adminShadow, adminSpacing, adminTypography } from "./adminTheme";

export function AdminPanel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
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
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function AdminSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: adminColors.panel,
    borderColor: "#2A2A2A",
    borderRadius: adminRadius.md,
    borderWidth: 1,
    padding: adminSpacing.lg,
    ...adminShadow,
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
