import { type ReactNode } from "react";
export function Input({ label, icon, error, ...props }: { label?: string; icon?: ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">{label}</label><div className="relative">{icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</div>}<input {...props} className={`input-base border-ink-200 dark:border-ink-700 ${icon ? "pl-10" : ""} ${error ? "border-error-500" : ""}`} /></div></div>;
}
