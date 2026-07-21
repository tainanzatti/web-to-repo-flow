import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; icon?: ReactNode; error?: string | null | undefined; hint?: string; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, icon, error, hint, className = "", id, ...props }, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, "-") || "field"}`;
  return <div className="w-full">{label && <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 dark:text-ink-300 mb-1.5">{label}</label>}<div className="relative">{icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</div>}<input ref={ref} id={inputId} aria-label={label || props["aria-label"]} aria-invalid={!!error} className={`input-base ${icon ? "pl-10" : ""} ${error ? "border-error-400 dark:border-error-500" : "border-ink-200 dark:border-ink-700"} ${className}`} {...props} /></div>{hint && !error && <p className="text-xs text-ink-400 mt-1">{hint}</p>}</div>;
});
Input.displayName = "Input";
