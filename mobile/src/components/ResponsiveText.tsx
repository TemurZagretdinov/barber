import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../theme/theme";

export type ResponsiveTextVariant = "hero" | "title" | "section" | "body" | "label" | "small";

interface ResponsiveTextProps extends Omit<TextProps, "style"> {
  variant?: ResponsiveTextVariant;
  color?: "text" | "muted" | "subtle" | "gold" | "success" | "warning" | "danger" | "onGold";
  align?: "left" | "center" | "right";
  style?: TextStyle | (TextStyle | undefined)[];
  wrap?: boolean;
}

export function ResponsiveText({
  variant = "body",
  color = "text",
  align = "left",
  style,
  wrap = true,
  numberOfLines,
  ...props
}: ResponsiveTextProps) {
  const { theme } = useTheme();

  const variantStyle = theme.typography[variant];
  const colorValue = theme.colors[color];

  return (
    <Text
      style={[
        variantStyle,
        { color: colorValue, textAlign: align },
        wrap ? { flexShrink: 1, flexWrap: "wrap" } : {},
        style,
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode={numberOfLines ? "tail" : undefined}
      {...props}
    />
  );
}
