import { ReactNode, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors } from "./ScreenContainer";

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
  icon?: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const isGhost = variant === "ghost";

  function pressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 60 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View
        style={[
          styles.button,
          isGhost ? styles.ghost : styles.primary,
          (disabled || loading) && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isGhost ? colors.gold : "#0A0A0A"} />
        ) : icon ? (
          icon
        ) : null}
        {title ? (
          <Text
            style={[
              styles.text,
              isGhost ? styles.ghostText : styles.primaryText,
              (disabled || loading) && styles.disabledText,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.gold,
  },
  ghost: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1.5,
    borderColor: colors.goldDim,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  primaryText: {
    color: "#0A0A0A",
  },
  ghostText: {
    color: "#FFFFFF",
  },
  disabled: {
    backgroundColor: "#1E1E1E",
    borderColor: "#2A2A2A",
    opacity: 0.5,
  },
  disabledText: {
    color: "#555555",
  },
});
