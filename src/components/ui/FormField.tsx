import { type ReactNode } from "react";
import { Input } from "./Input";

interface FormFieldProps {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, icon, error, hint, children }: FormFieldProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</div>}
        {children}
      </div>
      {hint && !error && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-error-600 mt-1 animate-fadeIn" role="alert">{message}</p>;
}
