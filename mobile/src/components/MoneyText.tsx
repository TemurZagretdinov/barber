import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../theme/theme";

interface MoneyTextProps extends Omit<TextProps, "style"> {
  amount: number;
  color?: "text" | "muted" | "gold" | "success" | "warning" | "danger" | "onGold";
  align?: "left" | "center" | "right";
  style?: TextStyle | (TextStyle | undefined)[];
  compact?: boolean;
}

export function MoneyText({
  amount,
  color = "text",
  align = "left",
  style,
  compact = false,
  ...props
}: MoneyTextProps) {
  const { theme } = useTheme();

  const colorValue = theme.colors[color];

  let formattedAmount = "";
  if (compact && amount >= 1000000) {
    formattedAmount = `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 2)} mln so'm`;
  } else if (compact && amount >= 1000) {
    formattedAmount = `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k so'm`;
  } else {
    formattedAmount = `${amount.toLocaleString("uz-UZ")} so'm`;
  }

  return (
    <Text
      style={[
        theme.typography.body,
        { color: colorValue, textAlign: align, fontWeight: "800" },
        style,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      {...props}
    >
      {formattedAmount}
    </Text>
  );
}
