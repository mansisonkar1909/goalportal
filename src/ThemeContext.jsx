import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "goalportal-theme";

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved === "dark";
    } catch {
      /* ignore */
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try {
      localStorage.setItem(STORAGE_KEY, darkMode ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((d) => !d);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={darkMode}
      onClick={toggleTheme}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--gp-toggle-bg)",
        border: "1px solid var(--gp-select-border)",
        borderRadius: 99,
        padding: "4px 4px 4px 10px",
        cursor: "pointer",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
      }}
    >
      <span style={{ opacity: darkMode ? 0.5 : 1 }}>☀️</span>
      <span
        style={{
          width: 36,
          height: 20,
          borderRadius: 99,
          background: darkMode ? "#6366f1" : "#94a3b8",
          position: "relative",
          transition: "background .2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: darkMode ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,.3)",
          }}
        />
      </span>
      <span style={{ opacity: darkMode ? 1 : 0.5, paddingRight: 6 }}>🌙</span>
    </button>
  );
}
