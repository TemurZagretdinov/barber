import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "sharp-cuts-mobile-theme";

const palette = {
  gold: "#C9A96E",
  goldLight: "#D9C08C",
  goldDark: "#8F6E32",
  bronze: "#A7752C",
  emerald: "#10B981",
  red: "#EF4444",
  orange: "#F97316",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const typography = {
  hero: { fontSize: 30, lineHeight: 36, fontWeight: "900" as const },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "800" as const },
  section: { fontSize: 18, lineHeight: 24, fontWeight: "800" as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "800" as const },
  small: { fontSize: 11, lineHeight: 15, fontWeight: "700" as const },
};

export const buttonSizes = {
  sm: { minHeight: 42, paddingHorizontal: 14, borderRadius: radius.md },
  md: { minHeight: 54, paddingHorizontal: 18, borderRadius: radius.md },
  lg: { minHeight: 58, paddingHorizontal: 20, borderRadius: radius.lg },
};

export const inputSizes = {
  md: { minHeight: 56, paddingHorizontal: 16, borderRadius: radius.md },
};

const darkColors = {
  mode: "dark" as const,
  canvas: "#0A0A0A",
  surface: "#111111",
  card: "#151515",
  elevated: "#1C1C1C",
  input: "#1B1B1B",
  tabBar: "rgba(21,21,21,0.96)",
  overlay: "rgba(0,0,0,0.78)",
  text: "#FFFFFF",
  body: "#D4D4D4",
  muted: "#8D8D8D",
  subtle: "#5F5F5F",
  line: "#2A2A2A",
  lineStrong: "#3A3A3A",
  gold: palette.gold,
  goldLight: palette.goldLight,
  goldDark: palette.goldDark,
  bronze: palette.bronze,
  onGold: "#0A0A0A",
  goldDim: "rgba(201,169,110,0.28)",
  goldSoft: "#1A1200",
  success: palette.emerald,
  successBg: "#001A0D",
  successLine: "#064E3B",
  warning: palette.gold,
  warningBg: "#1A1200",
  warningLine: "#3A2800",
  danger: palette.red,
  dangerBg: "#1A0707",
  dangerLine: "#3A1010",
  orange: palette.orange,
};

const lightColors = {
  mode: "light" as const,
  canvas: "#F6EFE3",
  surface: "#FFF8EE",
  card: "#FFF9F0",
  elevated: "#F1E3CF",
  input: "#FFFDF7",
  tabBar: "rgba(255,248,238,0.96)",
  overlay: "rgba(36,28,18,0.36)",
  text: "#241C14",
  body: "#4A3C2F",
  muted: "#746553",
  subtle: "#9A8C78",
  line: "#E6D6BD",
  lineStrong: "#CDB891",
  gold: "#9A6A23",
  goldLight: "#C79A4D",
  goldDark: "#604012",
  bronze: palette.bronze,
  onGold: "#FFF8EA",
  goldDim: "rgba(154,106,35,0.24)",
  goldSoft: "#F9E9C8",
  success: "#087F5B",
  successBg: "#EAF7EF",
  successLine: "#B8DFC8",
  warning: "#8A641F",
  warningBg: "#FFF1CF",
  warningLine: "#E7C982",
  danger: "#B42318",
  dangerBg: "#FFF0EC",
  dangerLine: "#EFB5AA",
  orange: "#B65A13",
};

export const darkTheme = {
  mode: "dark" as const,
  colors: darkColors,
  spacing,
  radius,
  typography,
  buttonSizes,
  inputSizes,
  shadows: Platform.select({
    ios: {
      shadowColor: palette.gold,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 2 },
    default: {},
  }),
};

export const lightTheme = {
  ...darkTheme,
  mode: "light" as const,
  colors: lightColors,
  shadows: Platform.select({
    ios: {
      shadowColor: "#8A641F",
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
    },
    android: { elevation: 3 },
    default: {},
  }),
};

export type AppTheme = typeof darkTheme | typeof lightTheme;

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === "dark" || saved === "light") {
          setModeState(saved);
        }
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = mode === "dark" ? darkTheme : lightTheme;

    return {
      mode,
      theme,
      isDark: mode === "dark",
      setMode: async (nextMode) => {
        setModeState(nextMode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
      },
      toggleTheme: async () => {
        const nextMode = mode === "dark" ? "light" : "dark";
        setModeState(nextMode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
      },
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
