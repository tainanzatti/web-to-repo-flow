import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({ label, error, ...props }: { label?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">{label}</label><div className="relative"><input {...props} type={show ? "text" : "password"} className={`input-base border-ink-200 dark:border-ink-700 pr-10 ${error ? "border-error-500" : ""}`} /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>;
}
