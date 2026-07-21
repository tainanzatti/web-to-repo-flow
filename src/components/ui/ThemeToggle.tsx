import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../lib/theme-context";
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all" aria-label="Alternar tema">{theme === "dark" ? <Sun className="w-5 h-5 text-warning-500" /> : <Moon className="w-5 h-5 text-ink-600" />}</button>;
}
