import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../theme/theme";
import type { AvailableSlot } from "../types/barber";

export function TimeSlotButton({
  slot,
  selected,
  onPress,
}: {
  slot: AvailableSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const disabled = !slot.is_available || slot.is_booked || slot.is_expired;
  const stateStyle = selected
    ? { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold }
    : disabled
      ? slot.is_expired
        ? { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLine, opacity: 0.72 }
        : { backgroundColor: theme.colors.card, borderColor: theme.colors.line, opacity: 0.55 }
      : { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, stateStyle, selected && theme.shadows]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? theme.colors.onGold : disabled ? theme.colors.subtle : theme.colors.text },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {slot.time}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "31%",
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
  },
  text: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
