import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "./ScreenContainer";
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
  return (
    <Pressable
      disabled={!slot.is_available}
      onPress={onPress}
      style={[
        styles.button,
        selected
          ? styles.selected
          : slot.is_available
            ? styles.available
            : slot.is_expired
              ? styles.expired
              : styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected
            ? styles.selectedText
            : slot.is_available
              ? styles.availableText
              : styles.disabledText,
        ]}
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
  selected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  available: {
    backgroundColor: "#1C1C1C",
    borderColor: "#2A2A2A",
  },
  disabled: {
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    opacity: 0.5,
  },
  expired: {
    backgroundColor: "#1A0000",
    borderColor: "#2A1515",
    opacity: 0.6,
  },
  text: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  selectedText: {
    color: "#0A0A0A",
    fontWeight: "800",
  },
  availableText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#444444",
  },
});
