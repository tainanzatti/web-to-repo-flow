import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      className="fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 shadow-sm flex items-center justify-center text-ink-600 dark:text-ink-200 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 animate-themeIn"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-warning-400" />
      ) : (
        <Moon className="w-5 h-5 text-brand-600" />
      )}
    </button>
  );
}
