/**
 * Reusable theme colors and styles
 */

export const colors = {
  // Bid colors (green)
  bid: {
    primary: "#50be78",
    background: "rgba(80, 190, 120, 0.3)",
    text: "#50be78",
  },
  // Ask colors (red)
  ask: {
    primary: "#d2505a",
    background: "rgba(210, 80, 90, 0.3)",
    text: "#d2505a",
  },
  // Dark theme
  dark: {
    background: "#1a1a1a",
    surface: "#2a2a2a",
    border: "#333",
    text: "#e0e0e0",
    textMuted: "#b0b0b0",
    textSecondary: "#888",
  },
  // Light theme
  light: {
    background: "#ffffff",
    surface: "#f5f5f5",
    border: "#ddd",
    text: "#333333",
    textMuted: "#666",
    textSecondary: "#666",
  },
  // Common colors
  error: "#d2505a",
  success: "#50be78",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",
} as const;

export const borderRadius = {
  sm: "4px",
  md: "6px",
  lg: "8px",
} as const;

export const fontSize = {
  xs: "12px",
  sm: "13px",
  md: "14px",
  lg: "16px",
  xl: "18px",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const transitions = {
  fast: "0.15s ease",
  normal: "0.2s ease",
  slow: "0.3s ease",
} as const;

