import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme/theme";

export function PremiumCard({
  children,
  style,
  elevated = false,
  gold = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  gold?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? theme.colors.elevated : theme.colors.card,
          borderColor: gold ? theme.colors.goldDim : theme.colors.line,
          borderRadius: theme.radius.lg,
        },
        (elevated || theme.mode === "light") && theme.shadows,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
  },
});
