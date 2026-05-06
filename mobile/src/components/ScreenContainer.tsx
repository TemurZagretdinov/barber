import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Luxury Dark Gold Design Tokens ──────────────────────────────────────────
export const colors = {
  canvas: "#0A0A0A",       // near-black background
  card: "#141414",         // dark card surface
  text: "#FFFFFF",         // primary white text
  muted: "#888888",        // secondary muted text
  line: "#2A2A2A",         // subtle border
  soft: "#1C1C1C",         // elevated surface
  black: "#C9A96E",        // repurposed as gold primary accent
  gold: "#C9A96E",         // explicit gold alias
  goldLight: "#D4B483",    // lighter gold tint
  goldDim: "#C9A96E40",    // translucent gold for borders
  success: "#10b981",      // emerald green
  warning: "#C9A96E",      // gold warning
  danger: "#ef4444",       // red danger
};

export function ScreenContainer({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.inner}>{children}</View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 34,
  },
  inner: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 18,
  },
});
