// Design System Constants

// Color Palette
export const colors = {
  // Primary brand colors
  primary: {
    50: "#f0e7ff",
    100: "#d9c2ff",
    200: "#b69dff",
    300: "#9678ff",
    400: "#7b5afc",
    500: "#6941e8", // Primary brand color
    600: "#5832d5",
    700: "#4726b7",
    800: "#371c94",
    900: "#291470",
  },
  // Secondary brand colors
  secondary: {
    50: "#e6f7ff",
    100: "#bae3ff",
    200: "#7cc4fa",
    300: "#47a3f3",
    400: "#2186eb",
    500: "#0967d2", // Secondary brand color
    600: "#0552b5",
    700: "#03449e",
    800: "#01337d",
    900: "#002159",
  },
  // Accent colors
  accent: {
    success: "#10b981", // Green
    warning: "#f59e0b", // Amber
    error: "#ef4444", // Red
    info: "#3b82f6", // Blue
  },
  // Neutral colors
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
}

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Clash Display", Inter, sans-serif',
    mono: "JetBrains Mono, monospace",
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
}

// Spacing
export const spacing = {
  0: "0",
  px: "1px",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
}

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
}

// Border Radius
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
}

// Transitions
export const transitions = {
  DEFAULT: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  timing: {
    DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  },
}

// Z-index
export const zIndex = {
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",
  auto: "auto",
}

// Animation
export const animations = {
  spin: "spin 1s linear infinite",
  ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
  pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  bounce: "bounce 1s infinite",
}

// Breakpoints
export const breakpoints = {
  xs: "480px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

// Design tokens for specific components
export const componentTokens = {
  button: {
    primary: {
      bg: "bg-gradient-to-r from-primary-600 to-secondary-600",
      hoverBg: "hover:from-primary-700 hover:to-secondary-700",
      text: "text-white",
      border: "border-transparent",
    },
    secondary: {
      bg: "bg-white dark:bg-neutral-800",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-700",
      text: "text-neutral-900 dark:text-white",
      border: "border border-neutral-300 dark:border-neutral-700",
    },
    outline: {
      bg: "bg-transparent",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
      text: "text-primary-600 dark:text-primary-400",
      border: "border border-primary-600 dark:border-primary-400",
    },
    ghost: {
      bg: "bg-transparent",
      hoverBg: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
      text: "text-neutral-700 dark:text-neutral-300",
      border: "border-transparent",
    },
  },
  card: {
    bg: "bg-white dark:bg-neutral-900",
    border: "border border-neutral-200 dark:border-neutral-800",
    shadow: "shadow-md",
    radius: "rounded-xl",
  },
  input: {
    bg: "bg-white dark:bg-neutral-800",
    border: "border border-neutral-300 dark:border-neutral-700",
    focusBorder: "focus:border-primary-500 dark:focus:border-primary-400",
    text: "text-neutral-900 dark:text-white",
    placeholder: "placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
  },
}

