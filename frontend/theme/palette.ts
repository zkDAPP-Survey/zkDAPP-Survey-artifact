export const palette = {
    background: "#FFFFFF",
    border: "#E2E8F0",
    surfaceSoft: "#F8FAFF",
    surfaceMuted: "#F1F5F9",

    // Primary - blue
    primary: "#2563EB",
    primaryPressed: "#1D4ED8",
    primaryNegative: "#EFF6FF",
    primaryLight: "#BFDBFE",

    // Success
    success: "#16A34A",
    successLight: "#DCFCE7",

    // orange
    orange: "#EA580C",
    orangeLight: "#FFF7ED",
    orangeBorder: "#FED7AA",

    //warning
    warning: "#DC2626",
    warningLight: "#FECACA",

    // Text
    textPrimary: "#000000",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",

    // Gray
    grayBackground: "#64748b17",
    grayBorder: "#64748B4D",

    // Green
    green: {
        text: "#16A34A",
        bgSoft: "#16a34a29",
    },

    // Blue
    blue: {
        text: "#2563EB",
        bgSoft: "#2563eb29",
    },

    // Gray
    gray: {
        text: "#64748B",
        bgSoft: "#64748b24",
    },

    // Dark primary
    primaryDark: "#0F172A",
    primaryDarkText: "#475569",

    white: "#FFFFFF",
    white75: "rgba(255,255,255,0.75)",
    white50: "rgba(255,255,255,0.5)",
    white25: "rgba(255,255,255,0.25)",
    white7: "rgba(255,255,255,0.07)",
    black: "#000000",

} as const;

export type Palette = typeof palette;
