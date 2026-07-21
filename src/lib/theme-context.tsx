import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "pmsc-theme";

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => {
    const cached = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return cached ?? "light";
  });

  // Apply theme class immediately on mount and whenever theme changes
  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Load theme from Supabase profile when user logs in
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("tema")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbTheme = (data as { tema?: string } | null)?.tema;
        if (dbTheme === "dark" || dbTheme === "light") {
          setThemeState(dbTheme);
        }
      });
  }, [user]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      // Persist to Supabase if logged in
      if (user) {
        supabase
          .from("profiles")
          .update({ tema: next })
          .eq("id", user.id)
          .then(() => {});
      }
      return next;
    });
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
