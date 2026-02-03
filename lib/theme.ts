"use client";

import { createTheme, alpha } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa",
      light: "#93c5fd",
      dark: "#3b82f6",
      contrastText: "#0f172a",
    },
    secondary: {
      main: "#a78bfa",
      light: "#c4b5fd",
      dark: "#8b5cf6",
    },
    success: {
      main: "#4ade80",
      light: "#86efac",
      dark: "#22c55e",
    },
    warning: {
      main: "#fbbf24",
      light: "#fcd34d",
      dark: "#f59e0b",
    },
    error: {
      main: "#f87171",
      light: "#fca5a5",
      dark: "#ef4444",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
    divider: alpha("#94a3b8", 0.12),
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h3: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%)",
          minHeight: "100vh",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
          padding: "12px 28px",
        },
        sizeLarge: {
          padding: "16px 32px",
          fontSize: "1rem",
        },
        contained: {
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)",
          },
        },
        containedError: {
          background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)",
          },
        },
        containedSuccess: {
          background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #86efac 0%, #4ade80 100%)",
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1e293b",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
        },
        filled: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: alpha("#0f172a", 0.5),
            "& fieldset": {
              borderColor: alpha("#94a3b8", 0.2),
            },
            "&:hover fieldset": {
              borderColor: alpha("#60a5fa", 0.5),
            },
            "&.Mui-focused fieldset": {
              borderColor: "#60a5fa",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: alpha("#0f172a", 0.5),
          "& fieldset": {
            borderColor: alpha("#94a3b8", 0.2),
          },
          "&:hover fieldset": {
            borderColor: alpha("#60a5fa", 0.5),
          },
          "&.Mui-focused fieldset": {
            borderColor: "#60a5fa",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#0f172a", 0.8),
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 70,
          backgroundColor: alpha("#1e293b", 0.95),
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: "#64748b",
          "&.Mui-selected": {
            color: "#60a5fa",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardSuccess: {
          backgroundColor: alpha("#22c55e", 0.15),
          color: "#4ade80",
        },
        standardError: {
          backgroundColor: alpha("#ef4444", 0.15),
          color: "#f87171",
        },
        standardWarning: {
          backgroundColor: alpha("#f59e0b", 0.15),
          color: "#fbbf24",
        },
        standardInfo: {
          backgroundColor: alpha("#3b82f6", 0.15),
          color: "#60a5fa",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: alpha("#60a5fa", 0.15),
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: alpha("#0f172a", 0.6),
            fontWeight: 600,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: alpha("#60a5fa", 0.05),
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1e293b",
          backgroundImage: "none",
        },
      },
    },
  },
});
