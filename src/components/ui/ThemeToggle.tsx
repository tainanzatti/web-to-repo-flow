import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme-context";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-lg bg-white dark:bg-ink-900 shadow-md border border-ink-100 dark:border-ink-800 flex items-center justify-center text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
      aria-label="Alternar tema"
    >
      {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
