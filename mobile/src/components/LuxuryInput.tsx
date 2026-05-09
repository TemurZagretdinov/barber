import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, TextInput, type TextInputProps } from "react-native";

import { useTheme } from "../theme/theme";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export function LuxuryInput({
  icon,
  secureTextEntry,
  style,
  ...props
}: TextInputProps & {
  icon?: IoniconName;
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focus = useRef(new Animated.Value(0)).current;

  function handleFocus(event: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) {
    setFocused(true);
    Animated.timing(focus, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    props.onFocus?.(event);
  }

  function handleBlur(event: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) {
    setFocused(false);
    Animated.timing(focus, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    props.onBlur?.(event);
  }

  const borderColor = focus.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.line, theme.colors.gold],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          minHeight: theme.inputSizes.md.minHeight,
          paddingHorizontal: theme.inputSizes.md.paddingHorizontal,
          borderRadius: theme.inputSizes.md.borderRadius,
          backgroundColor: theme.colors.input,
          borderColor,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={19}
          color={focused ? theme.colors.gold : theme.colors.subtle}
          style={styles.icon}
        />
      ) : null}
      <TextInput
        {...props}
        secureTextEntry={secureTextEntry && !showPassword}
        placeholderTextColor={theme.colors.subtle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[styles.input, { color: theme.colors.text }, style]}
      />
      {secureTextEntry ? (
        <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10} style={styles.eye}>
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={19}
            color={theme.colors.subtle}
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  icon: {
    marginRight: 11,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    minWidth: 0,
  },
  eye: {
    marginLeft: 8,
    padding: 4,
  },
});
