export function ErrorMessage({ message }: { message?: string }) { if (!message) return null; return <p className="text-xs text-error-600 dark:text-error-400 mt-1">{message}</p>; }
