import { Platform } from "react-native";

export const adminColors = {
  canvas: "#0A0A0A",
  panel: "#141414",
  text: "#FFFFFF",
  body: "#CCCCCC",
  muted: "#888888",
  line: "#2A2A2A",
  soft: "#1C1C1C",
  black: "#C9A96E",       // repurposed as gold primary
  gold: "#C9A96E",
  goldDim: "#C9A96E40",
  successBg: "#001A0D",
  successText: "#10b981",
  warningBg: "#1A1200",
  warningText: "#C9A96E",
  danger: "#ef4444",
};

export const adminSpacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const adminRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const adminTypography = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    color: "#888888",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    color: "#CCCCCC",
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    color: "#888888",
  },
};

export const adminShadow = Platform.select({
  ios: {
    shadowColor: "#C9A96E",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 2,
  },
  default: {},
});
