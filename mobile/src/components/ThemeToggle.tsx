import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, theme, toggleTheme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 60 }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  }

  return (
    <Pressable
      onPress={toggleTheme}
      onPressIn={pressIn}
      onPressOut={pressOut}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.wrap,
          {
            width: compact ? 44 : undefined,
            height: compact ? 44 : undefined,
            paddingHorizontal: compact ? 0 : 12,
            borderColor: theme.colors.goldDim,
            backgroundColor: theme.colors.input,
            transform: [{ scale }],
          },
          theme.shadows,
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: theme.colors.goldSoft }]}>
          <Ionicons name={isDark ? "moon" : "sunny"} size={17} color={theme.colors.gold} />
        </View>
        {!compact ? <Text style={[styles.label, { color: theme.colors.text }]}>{isDark ? "Tungi" : "Yorug'"}</Text> : null}
        {!compact ? (
          <View style={[styles.knobTrack, { backgroundColor: theme.colors.elevated }]}>
            <View
              style={[
                styles.knob,
                {
                  backgroundColor: theme.colors.gold,
                  alignSelf: isDark ? "flex-start" : "flex-end",
                },
              ]}
            />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
  knobTrack: {
    width: 34,
    height: 18,
    borderRadius: 9,
    padding: 3,
    justifyContent: "center",
  },
  knob: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
