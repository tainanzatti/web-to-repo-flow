import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
