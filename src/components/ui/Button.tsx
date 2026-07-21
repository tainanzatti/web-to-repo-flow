import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
export function Button({ children, loading, className, ...props }: { children: ReactNode; loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={className} disabled={loading || props.disabled}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}</button>;
}
