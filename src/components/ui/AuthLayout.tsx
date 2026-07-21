import { type ReactNode } from "react";
import { Shield } from "lucide-react";
export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-ink-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 px-4 py-8"><div className="w-full max-w-md"><div className="flex flex-col items-center mb-8"><div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-600/20"><Shield className="w-7 h-7 text-white" /></div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">{title}</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1 text-center">{subtitle}</p></div>{children}</div></div>;
}
