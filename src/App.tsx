import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/sidebar";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { PainelView } from "./components/views/painel-view";
import { NucleoView } from "./components/views/nucleo-view";
import { FlashcardsView } from "./components/views/flashcards-view";
import { RedacaoView } from "./components/views/redacao-view";
import { DesempenhoView } from "./components/views/desempenho-view";
import { PerfilView } from "./components/views/perfil-view";
import { QuestoesView } from "./components/views/questoes-view";
import { RankingView } from "./components/views/ranking-view";
import { ThemeToggle } from "./components/ui/ThemeToggle";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  <Routes>
                    <Route path="/" element={<PainelView />} />
                    <Route path="/painel" element={<PainelView />} />
                    <Route path="/nucleo" element={<NucleoView />} />
                    <Route path="/flashcards" element={<FlashcardsView />} />
                    <Route path="/redacao" element={<RedacaoView />} />
                    <Route path="/questoes" element={<QuestoesView />} />
                    <Route path="/ranking" element={<RankingView />} />
                    <Route path="/desempenho" element={<DesempenhoView />} />
                    <Route path="/perfil" element={<PerfilView />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        >
          <Route path="*" element={<PainelView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
