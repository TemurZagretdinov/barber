import { ReactNode, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { useTheme } from "../theme/theme";

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isGhost = variant === "ghost";
  const sizeToken = theme.buttonSizes[size];

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  }

  const inactive = disabled || loading;
  const containerStyle = getContainerLayoutStyle(style);

  return (
    <Pressable disabled={inactive} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={containerStyle}>
      <Animated.View
        style={[
          styles.button,
          {
            minHeight: sizeToken.minHeight,
            paddingHorizontal: sizeToken.paddingHorizontal,
            borderRadius: sizeToken.borderRadius,
            backgroundColor: isGhost ? theme.colors.elevated : theme.colors.gold,
            borderColor: isGhost ? theme.colors.goldDim : theme.colors.gold,
            opacity: inactive ? 0.55 : 1,
            transform: [{ scale }],
          },
          !isGhost && theme.shadows,
          style,
        ]}
      >
        {loading ? <ActivityIndicator color={isGhost ? theme.colors.gold : theme.colors.onGold} /> : icon ?? null}
        {title ? (
          <Text
            style={[
              styles.text,
              {
                color: isGhost ? theme.colors.text : theme.colors.onGold,
                fontSize: size === "sm" ? 13 : 16,
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton(props: Omit<Parameters<typeof PrimaryButton>[0], "variant">) {
  return <PrimaryButton {...props} variant="ghost" />;
}

function getContainerLayoutStyle(style?: StyleProp<ViewStyle>): StyleProp<ViewStyle> {
  const flat = StyleSheet.flatten(style);
  if (!flat) {
    return undefined;
  }

  return {
    width: flat.width,
    minWidth: flat.minWidth,
    maxWidth: flat.maxWidth,
    flex: flat.flex,
    flexGrow: flat.flexGrow,
    flexShrink: flat.flexShrink,
    alignSelf: flat.alignSelf,
    margin: flat.margin,
    marginBottom: flat.marginBottom,
    marginEnd: flat.marginEnd,
    marginHorizontal: flat.marginHorizontal,
    marginLeft: flat.marginLeft,
    marginRight: flat.marginRight,
    marginStart: flat.marginStart,
    marginTop: flat.marginTop,
    marginVertical: flat.marginVertical,
  };
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: {
    fontWeight: "800",
    textAlign: "center",
  },
});
