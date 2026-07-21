import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/sidebar";
import { NucleoView } from "./components/views/nucleo-view";
import { FlashcardsView } from "./components/views/flashcards-view";
import { QuestoesView } from "./components/views/questoes-view";
import { RedacaoView } from "./components/views/redacao-view";
import { PainelView } from "./components/views/painel-view";
import { PerfilView } from "./components/views/perfil-view";
import { DesempenhoView } from "./components/views/desempenho-view";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { useAuth } from "./lib/auth-context";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <div className="absolute top-4 left-20 z-50">
        <ThemeToggle />
      </div>
      <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/painel" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/cadastro" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/painel" replace />} />
              <Route path="/painel" element={<PainelView />} />
              <Route path="/nucleo" element={<NucleoView />} />
              <Route path="/flashcards" element={<FlashcardsView />} />
              <Route path="/questoes" element={<QuestoesView />} />
              <Route path="/redacao" element={<RedacaoView />} />
              <Route path="/desempenho" element={<DesempenhoView />} />
              <Route path="/perfil" element={<PerfilView />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
