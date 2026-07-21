import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { loading?: boolean; children: ReactNode; }
export function Button({ loading, children, disabled, className = "", ...props }: ButtonProps) {
  return <button disabled={disabled || loading} className={`btn ${className}`} {...props}>{loading && <Loader2 className="w-4 h-4 animate-spin" />}{children}</button>;
}
