import { type ReactNode } from "react";
import { Shield } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-ink-50 via-brand-50 to-ink-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
          <p className="text-sm text-ink-500 mt-1 text-center">{subtitle}</p>
        </div>
        <div className="card p-6 sm:p-8 shadow-lg shadow-ink-200/50 animate-fadeIn">
          {children}
        </div>
      </div>
    </div>
  );
}
