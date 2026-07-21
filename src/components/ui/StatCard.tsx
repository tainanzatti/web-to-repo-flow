import { type ReactNode } from "react";

export function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    success: "bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300",
    ink: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
    error: "bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300",
  };
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] ?? colorMap.brand}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-ink-900 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{label}</p>
    </div>
  );
}
