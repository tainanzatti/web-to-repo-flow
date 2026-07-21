import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", loading = false, children, className = "", disabled, ...props }: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost: "btn-ghost",
  }[variant];

  return (
    <button className={`${variantClass} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
