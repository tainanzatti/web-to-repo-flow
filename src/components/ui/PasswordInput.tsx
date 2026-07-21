import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null | undefined;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const [show, setShow] = useState(false);
    const inputId = id || `pw-${label?.toLowerCase().replace(/\s/g, "-") || "field"}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
          <input
            ref={ref}
            id={inputId}
            type={show ? "text" : "password"}
            aria-label={label || "Senha"}
            aria-invalid={!!error}
            className={`w-full rounded-xl border bg-white pl-10 pr-10 py-2.5 text-sm text-ink-800 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
              error ? "border-error-400" : "border-ink-200"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
