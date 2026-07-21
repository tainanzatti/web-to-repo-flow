import { useState } from 'react'
import Sidebar, { type ViewKey } from './components/sidebar'
import NucleoView from './components/views/nucleo-view'
import FlashcardsView from './components/views/flashcards-view'
import PainelView from './components/views/painel-view'
import DesempenhoView from './components/views/desempenho-view'
import ComparativoView from './components/views/comparativo-view'
import RedacaoView from './components/views/redacao-view'
import PerfilView from './components/views/perfil-view'
import FocoView from './components/views/foco-view'
import MaterialModal from './components/material-modal'
import { fetchDisciplines } from './lib/db'
import type { Discipline } from './lib/types'

function App() {
  const [view, setView] = useState<ViewKey>('painel')
  const [studyTarget, setStudyTarget] = useState<{
    disciplineId: string
    topicId: string | null
  } | null>(null)
  const [disciplineCache, setDisciplineCache] = useState<Discipline[]>([])

  async function handleStudy(disciplineId: string, topicId: string | null) {
    if (disciplineCache.length === 0) {
      const d = await fetchDisciplines()
      setDisciplineCache(d)
    }
    setStudyTarget({ disciplineId, topicId })
  }

  const studyDiscipline = studyTarget
    ? disciplineCache.find((d) => d.id === studyTarget.disciplineId)
    : null

  return (
    <div className="app-layout">
      {view !== 'foco' && (
        <Sidebar current={view} onNavigate={setView} />
      )}
      <main className="app-main">
        {view === 'painel' && (
          <PainelView onNavigate={(v) => setView(v)} />
        )}
        {view === 'nucleo' && <NucleoView onStudy={handleStudy} />}
        {view === 'flashcards' && <FlashcardsView />}
        {view === 'desempenho' && <DesempenhoView />}
        {view === 'comparativo' && <ComparativoView />}
        {view === 'redacao' && <RedacaoView />}
        {view === 'perfil' && <PerfilView />}
        {view === 'foco' && <FocoView onExit={() => setView('painel')} />}
      </main>

      {studyTarget && studyDiscipline && (
        <MaterialModal
          discipline={studyDiscipline}
          topicId={studyTarget.topicId}
          onClose={() => setStudyTarget(null)}
        />
      )}
    </div>
  )
}

export default App
