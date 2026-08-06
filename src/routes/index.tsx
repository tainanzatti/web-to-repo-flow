import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import {
  PieChart,
  Home,
  LayoutGrid,
  BookOpen,
  BarChart3,
  ClipboardList,
  LineChart,
  Trophy,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  Loader2,
  Timer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  CURRICULUM,
  ROTATION_ORDER,
  allocateMinutes,
  nextHeroDiscipline,
  selectActiveTopics,
  disciplineTopicsWithMastery,
  maxTopicsForDiscipline,
  type AllocatedTopic,
  type DisciplineSkips,
  type Lancamento,
} from '@/lib/curriculum'
import { useAuth } from '@/lib/auth-context'
import {
  fetchLancamentos,
  insertLancamentos,
  deleteLancamento as deleteLancamentoDb,
  deleteAllLancamentos,
  fetchDisciplineSkips,
  registerDisciplineSkip,
  clearDisciplineSkipStreak,
} from '@/lib/db'
import { PainelView } from '@/components/views/painel-view'
import { CicloView } from '@/components/views/ciclo-view'
import { NucleoView } from '@/components/views/nucleo-view'
import { MateriaisView } from '@/components/views/materiais-view'
import { DesempenhoView } from '@/components/views/desempenho-view'
import { LancamentoView } from '@/components/views/lancamento-view'
import { ComparativoView } from '@/components/views/comparativo-view'
import { RankingView } from '@/components/views/ranking-view'
import { PerfilView } from '@/components/views/perfil-view'
import { ConcluirModal } from '@/components/concluir-modal'
import { MaterialModal } from '@/components/material-modal'
import { FocusMode } from '@/components/focus-mode'
import { IconTip } from '@/components/ui-bits'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Painel de Estudos — Operação PMSC Soldado 2026' },
      {
        name: 'description',
        content:
          'Painel do candidato: ciclo de estudos ponderado pelo edital, desempenho por tópico, materiais de IA e ranking para a PMSC 2026.',
      },
      { property: 'og:title', content: 'Painel de Estudos — Operação PMSC Soldado 2026' },
      {
        property: 'og:description',
        content:
          'Painel do candidato: ciclo de estudos ponderado pelo edital, desempenho por tópico, materiais de IA e ranking para a PMSC 2026.',
      },
      {
        property: 'og:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/df3b997f-03c2-4b72-99ad-0bd5212b559d/id-preview-0ea92b26--abca5d6e-5074-4361-b3f8-788d45b1878d.lovable.app-1783707883430.png',
      },
      {
        name: 'twitter:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/df3b997f-03c2-4b72-99ad-0bd5212b559d/id-preview-0ea92b26--abca5d6e-5074-4361-b3f8-788d45b1878d.lovable.app-1783707883430.png',
      },
    ],
  }),
  component: OperacaoPMSC,
})


type ViewId =
  | 'painel'
  | 'ciclo'
  | 'nucleo'
  | 'materiais'
  | 'desempenho'
  | 'lancamento'
  | 'comparativo'
  | 'ranking'
  | 'perfil'

const NAV: { section: string; items: { id: ViewId; label: string; icon: LucideIcon }[] }[] = [
  {
    section: 'Home',
    items: [
      { id: 'painel', label: 'Painel', icon: Home },
      { id: 'ciclo', label: 'Ciclo', icon: PieChart },
      { id: 'nucleo', label: 'Núcleo', icon: LayoutGrid },
      { id: 'materiais', label: 'Materiais', icon: BookOpen },
      { id: 'desempenho', label: 'Desempenho', icon: BarChart3 },
    ],
  },
  {
    section: 'Gestão de estudos',
    items: [
      { id: 'lancamento', label: 'Lançamento de questões', icon: ClipboardList },
      { id: 'comparativo', label: 'Comparativo', icon: LineChart },
      { id: 'ranking', label: 'Ranking', icon: Trophy },
    ],
  },
  {
    section: 'Configurações',
    items: [{ id: 'perfil', label: 'Meu perfil', icon: User }],
  },
]

const VIEW_TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  painel: { title: 'Painel', subtitle: 'Seu centro de comando do dia' },
  ciclo: { title: 'Ciclo de Estudos', subtitle: 'Rotação automática guiada pelos pesos do edital' },
  nucleo: { title: 'Núcleo', subtitle: 'Progresso de revisão por assunto do edital' },
  materiais: { title: 'Materiais', subtitle: '[PMSC] Soldado 2026 — materiais por assunto' },
  desempenho: { title: 'Desempenho', subtitle: 'Acompanhe seu progresso pessoal' },
  lancamento: { title: 'Lançamento de questões', subtitle: 'Registre seus resultados diários' },
  comparativo: { title: 'Comparativo', subtitle: 'Seus resultados em relação aos outros alunos' },
  ranking: { title: 'Ranking', subtitle: 'Suas posições no ranking da plataforma' },
  perfil: { title: 'Meu perfil', subtitle: 'Assinatura, plano e dados pessoais' },
}

function OperacaoPMSC() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const [view, setView] = useState<ViewId>('painel')
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [skips, setSkips] = useState<DisciplineSkips>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [material, setMaterial] = useState<{ discId: string; topicId: string } | null>(null)
  const [concluir, setConcluir] = useState<{ discId: string; topics: AllocatedTopic[] } | null>(null)
  const [focus, setFocus] = useState<{ discId: string; topics: AllocatedTopic[] } | null>(null)

  // Exige login para acessar o app
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [authLoading, user, navigate])

  // Carrega os lançamentos do usuário logado a partir do Supabase
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setDataLoading(true)
    Promise.all([fetchLancamentos(user.id), fetchDisciplineSkips(user.id)]).then(
      ([rows, skipRows]) => {
        if (cancelled) return
        setLancamentos(rows)
        setSkips(skipRows)
        setDataLoading(false)
      },
    )
    return () => {
      cancelled = true
    }
  }, [user])

  const openConcluir = useCallback(
    (discId: string) => {
      const all = disciplineTopicsWithMastery(lancamentos, discId)
      const maxCount = maxTopicsForDiscipline(all)
      const active = selectActiveTopics(all, discId, lancamentos, maxCount)
      setConcluir({ discId, topics: allocateMinutes(active) })
    },
    [lancamentos],
  )

  const openFocus = useCallback(() => {
    const discId = nextHeroDiscipline(lancamentos, skips)
    const all = disciplineTopicsWithMastery(lancamentos, discId)
    const active = selectActiveTopics(all, discId, lancamentos, maxTopicsForDiscipline(all))
    setFocus({ discId, topics: allocateMinutes(active) })
  }, [lancamentos, skips])



  const confirmConcluir = useCallback(
    async (entries: Omit<Lancamento, 'id'>[]) => {
      if (!user) return
      const saved = await insertLancamentos(user.id, entries)
      setLancamentos((prev) => [...prev, ...saved])
      // Concluir a disciplina zera a urgência acumulada por pulos.
      const discIds = [...new Set(saved.map((s) => s.disciplinaId))]
      await Promise.all(discIds.map((d) => clearDisciplineSkipStreak(user.id, d)))
      setSkips((prev) => {
        const next = { ...prev }
        for (const d of discIds) if (next[d]) next[d] = { ...next[d], consecutiveSkips: 0 }
        return next
      })
      setConcluir(null)
      setView('ciclo')
    },
    [user],
  )

  const addLancamento = useCallback(
    async (l: Omit<Lancamento, 'id'>) => {
      if (!user) return
      const saved = await insertLancamentos(user.id, [l])
      setLancamentos((prev) => [...prev, ...saved])
    },
    [user],
  )

  const deleteLancamento = useCallback(async (id: string) => {
    setLancamentos((prev) => prev.filter((l) => l.id !== id))
    await deleteLancamentoDb(id)
  }, [])

  const resetData = useCallback(async () => {
    if (!user) return
    await deleteAllLancamentos(user.id)
    setLancamentos([])
  }, [user])

  const skipDiscipline = useCallback(
    async (discId: string) => {
      if (!user) return
      const next = await registerDisciplineSkip(user.id, discId, skips[discId])
      setSkips((prev) => ({ ...prev, [discId]: next }))
    },
    [user, skips],
  )

  const openMaterial = useCallback((discId: string, topicId: string) => {
    setMaterial({ discId, topicId })
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate({ to: '/login' })
  }

  if (authLoading || !user || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    )
  }

  const nextDiscAfter = (discId: string) => {
    const idx = ROTATION_ORDER.indexOf(discId as (typeof ROTATION_ORDER)[number])
    return CURRICULUM[ROTATION_ORDER[(idx + 1) % ROTATION_ORDER.length]].name
  }

  const meta = VIEW_TITLES[view]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 pb-5 pt-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <Shield size={17} className="text-primary" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-wide text-foreground">
              OPERAÇÃO <span className="text-primary">PMSC</span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-faint">SOLDADO 2026</div>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="mb-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = view === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView(item.id)
                        setMobileNavOpen(false)
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-all duration-200 ease-in-out active:scale-[0.97] ${
                        active
                          ? 'bg-sidebar-active text-foreground'
                          : 'text-muted-foreground hover:bg-card-raised hover:text-foreground'
                      }`}
                      style={active ? { boxShadow: 'inset 2px 0 0 var(--primary)' } : undefined}
                    >
                      <item.icon size={15} className={active ? 'text-primary' : 'text-faint'} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card-raised font-display text-xs font-bold text-primary">
              {(user.email ?? '??').slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[12px] font-semibold text-foreground">
                {user.email}
              </div>
              <div className="text-[10px] text-faint">[PMSC] Soldado 2026</div>
            </div>
            <IconTip label="Sair da conta" side="top">
              <button
                onClick={handleSignOut}
                aria-label="Sair"
                className="shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-card-raised hover:text-primary"
              >
                <LogOut size={14} />
              </button>
            </IconTip>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border-soft px-4 py-4 sm:px-6">
          <IconTip label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'} side="bottom">
            <button
              className="rounded-md border border-border p-1.5 text-muted-foreground lg:hidden"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label="Abrir menu"
            >
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </IconTip>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold text-foreground">{meta.title}</h1>
            <p className="text-[11px] text-muted-foreground">{meta.subtitle}</p>
          </div>
          <IconTip label="Modo foco: cronômetro sem distrações" side="bottom">
            <button
              onClick={openFocus}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Timer size={14} />
              <span className="hidden sm:inline">Modo foco</span>
            </button>
          </IconTip>
        </header>


        <main className="flex-1 px-4 py-6 sm:px-6">
          <div
            key={view}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-in-out"
          >
            {view === 'painel' && (
              <PainelView
                lancamentos={lancamentos}
                skips={skips}
                onEstudar={openConcluir}
                onVerNucleo={() => setView('nucleo')}
                onOpenMaterial={openMaterial}
              />
            )}
            {view === 'ciclo' && (
              <CicloView
                lancamentos={lancamentos}
                skips={skips}
                onOpenMaterial={openMaterial}
                onConcluir={openConcluir}
              />
            )}
            {view === 'nucleo' && (
              <NucleoView
                lancamentos={lancamentos}
                skips={skips}
                onOpenMaterial={openMaterial}
                onEstudar={openConcluir}
                onSkip={skipDiscipline}
              />
            )}
            {view === 'materiais' && (
              <MateriaisView
                lancamentos={lancamentos}
                onOpenMaterial={openMaterial}
              />
            )}
            {view === 'desempenho' && (
              <DesempenhoView lancamentos={lancamentos} skips={skips} />
            )}
            {view === 'lancamento' && (
              <LancamentoView
                lancamentos={lancamentos}
                onAdd={addLancamento}
                onDelete={deleteLancamento}
              />
            )}
            {view === 'comparativo' && <ComparativoView lancamentos={lancamentos} />}
            {view === 'ranking' && <RankingView />}
            {view === 'perfil' && <PerfilView lancamentos={lancamentos} onReset={resetData} />}
          </div>
        </main>
      </div>

      {focus && (
        <FocusMode
          discId={focus.discId}
          topics={focus.topics}
          onClose={() => setFocus(null)}
          onConcluir={() => {
            const d = focus.discId
            setFocus(null)
            openConcluir(d)
          }}
        />
      )}



      {material && (
        <MaterialModal
          discId={material.discId}
          topicId={material.topicId}
          onClose={() => setMaterial(null)}
          onRedacaoNota={(nota) =>
            addLancamento({
              disciplinaId: 'redacao',
              topicoId: material.topicId,
              quantidade: 10,
              acertos: Math.round(nota),
              minutos: 60,
              data: new Date().toISOString().slice(0, 10),
            })
          }
        />
      )}

      {concluir && (
        <ConcluirModal
          discId={concluir.discId}
          topics={concluir.topics}
          nextDiscName={nextDiscAfter(concluir.discId)}
          onConfirm={confirmConcluir}
          onClose={() => setConcluir(null)}
        />
      )}
    </div>
  )
}
