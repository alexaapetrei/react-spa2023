import {
  createTheme,
  ThemeOptions,
  PaletteColor,
} from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    destructive: PaletteColor;
  }
  interface PaletteOptions {
    destructive?: PaletteColor;
  }
}

const getDesignTokens = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          primary: {
            main: "#333333",
            light: "#666666",
            dark: "#1a1a1a",
            contrastText: "#ffffff",
          },
          secondary: {
            main: "#f5f5f5",
            light: "#ffffff",
            dark: "#e0e0e0",
            contrastText: "#333333",
          },
          background: {
            default: "#fafafa",
            paper: "#ffffff",
          },
          text: {
            primary: "#333333",
            secondary: "#666666",
          },
          destructive: {
            main: "#d32f2f",
            light: "#ef5350",
            dark: "#c62828",
            contrastText: "#ffffff",
          },
          grey: {
            100: "#f5f5f5",
            200: "#e0e0e0",
            500: "#9e9e9e",
          },
        }
      : {
          primary: {
            main: "#fafafa",
            light: "#ffffff",
            dark: "#e0e0e0",
            contrastText: "#1a1a1a",
          },
          secondary: {
            main: "#333333",
            light: "#666666",
            dark: "#1a1a1a",
            contrastText: "#ffffff",
          },
          background: {
            default: "#1a1a1a",
            paper: "#262626",
          },
          text: {
            primary: "#fafafa",
            secondary: "#a0a0a0",
          },
          destructive: {
            main: "#ef5350",
            light: "#ff8a80",
            dark: "#e53935",
            contrastText: "#ffffff",
          },
          grey: {
            100: "#333333",
            200: "#262626",
            500: "#757575",
          },
        }),
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: "2rem", fontWeight: 600 },
    h2: { fontSize: "1.75rem", fontWeight: 600 },
    h3: { fontSize: "1.5rem", fontWeight: 600 },
    h4: { fontSize: "1.25rem", fontWeight: 600 },
    h5: { fontSize: "1.1rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    body1: { fontSize: "1rem" },
    body2: { fontSize: "0.875rem" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
        },
        sizeMedium: {
          height: 40,
        },
        sizeSmall: {
          height: 36,
        },
        sizeLarge: {
          height: 48,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: mode === "left" ? "0 12px 12px 0" : mode === "right" ? "12px 0 0 12px" : 0,
        },
      },
    },
  },
});

export const createAppTheme = (mode: "light" | "dark") =>
  createTheme(getDesignTokens(mode));

export type AppTheme = ReturnType<typeof createAppTheme>;
