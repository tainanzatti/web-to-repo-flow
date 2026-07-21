import { useState, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/sidebar";
import PainelView from "./components/views/painel-view";
import NucleoView from "./components/views/nucleo-view";
import FlashcardsView from "./components/views/flashcards-view";
import QuestoesView from "./components/views/questoes-view";
import DesempenhoView from "./components/views/desempenho-view";
import RedacaoView from "./components/views/redacao-view";
import PerfilView from "./components/views/perfil-view";
import { fetchFlashcardsPendentes } from "./lib/db";

export default function App() {
  const [flashcardsPendentes, setFlashcardsPendentes] = useState(0);

  const refreshFlashcards = useCallback(async () => {
    try {
      const data = await fetchFlashcardsPendentes();
      setFlashcardsPendentes(data.length);
    } catch {
      // ignore — may not be loaded yet
    }
  }, []);

  useEffect(() => {
    refreshFlashcards();
    const interval = setInterval(refreshFlashcards, 30000);
    return () => clearInterval(interval);
  }, [refreshFlashcards]);

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar flashcardsPendentes={flashcardsPendentes} />
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<PainelView />} />
          <Route path="/nucleo" element={<NucleoView />} />
          <Route path="/flashcards" element={<FlashcardsView />} />
          <Route path="/questoes" element={<QuestoesView />} />
          <Route path="/desempenho" element={<DesempenhoView />} />
          <Route path="/redacao" element={<RedacaoView />} />
          <Route path="/perfil" element={<PerfilView />} />
        </Routes>
      </main>
    </div>
  );
}
