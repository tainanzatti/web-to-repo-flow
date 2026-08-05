import { memo, useEffect, useMemo, useState } from 'react'
import {
  Target,
  Clock,
  FileText,
  CheckCircle2,
  Circle,
  Award,
  Sparkles,
  Loader2,
  RefreshCw,
  Flame,
  PlayCircle,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Gauge,
  Zap,
} from 'lucide-react'
import {
  CURRICULUM,
  ROTATION_ORDER,
  ALL_TOPICS_COUNT,
  tierInfo,
  allocateMinutes,
  selectActiveTopics,
  disciplineTopicsWithMastery,
  nextHeroDiscipline,
  computeCycleStats,
  computeStreak,
  maxTopicsForDiscipline,
  movingAverageMastery,
  type DisciplineSkips,
  type Lancamento,
} from '@/lib/curriculum'
import { generateAI } from '@/lib/ai-client'
import { loadString, saveString } from '@/lib/storage'
import { fetchDailyBriefing, upsertDailyBriefing } from '@/lib/db'
import { useAuth } from '@/lib/auth-context'
import { SectionLabel, AmmoBelt, PesoBadge, MarkdownLite, TypewriterMarkdown, IconTip } from '@/components/ui-bits'
import { StudyWheel } from '@/components/study-wheel'

type Props = {
  lancamentos: Lancamento[]
  skips?: DisciplineSkips
  onOpenMaterial: (discId: string, topicId: string) => void
  onConcluir: (discId: string) => void
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon: typeof Clock
  accent: string
}) {
  return (
    <div className="card-hover flex h-[104px] flex-col justify-between rounded-xl border border-border-soft bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="truncate text-[11px] font-medium text-muted-foreground">{label}</span>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </span>
      </div>
      <div className="truncate font-mono text-2xl font-bold text-foreground tabular-nums">{value}</div>
    </div>
  )
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const WEEKS = 26

function Heatmap({ lancamentos }: { lancamentos: Lancamento[] }) {
  const { weeks, maxMin } = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const l of lancamentos) {
      byDay.set(l.data, (byDay.get(l.data) ?? 0) + (l.minutos || 0))
    }
    // termina na semana atual (domingo->sábado)
    const today = new Date()
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - end.getDay()))
    const start = new Date(end)
    start.setDate(start.getDate() - (WEEKS * 7 - 1))

    const cols: { date: Date; iso: string; minutes: number; future: boolean }[][] = []
    const todayIso = today.toISOString().slice(0, 10)
    for (let w = 0; w < WEEKS; w++) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        const iso = date.toISOString().slice(0, 10)
        col.push({ date, iso, minutes: byDay.get(iso) ?? 0, future: iso > todayIso })
      }
      cols.push(col)
    }
    const maxMin = Math.max(60, ...Array.from(byDay.values()))
    return { weeks: cols, maxMin }
  }, [lancamentos])

  const level = (min: number) => {
    if (min <= 0) return 0
    const r = min / maxMin
    if (r <= 0.25) return 1
    if (r <= 0.5) return 2
    if (r <= 0.75) return 3
    return 4
  }
  const bg = (lvl: number) =>
    lvl === 0
      ? 'var(--card-raised)'
      : `color-mix(in srgb, var(--primary) ${lvl * 25}%, var(--card-raised))`

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-flex flex-col gap-1">
        {/* rótulos de mês */}
        <div className="flex gap-[3px] pl-6">
          {weeks.map((col, i) => {
            const first = col[0].date
            const prev = i > 0 ? weeks[i - 1][0].date : null
            const show = !prev || prev.getMonth() !== first.getMonth()
            return (
              <span
                key={i}
                className="w-[11px] font-mono text-[8px] text-faint"
                style={{ overflow: 'visible', whiteSpace: 'nowrap' }}
              >
                {show ? MONTH_LABELS[first.getMonth()] : ''}
              </span>
            )
          })}
        </div>
        <div className="flex gap-[3px]">
          {/* rótulos de dia */}
          <div className="mr-1 flex w-5 flex-col gap-[3px]">
            {['', 'Seg', '', 'Qua', '', 'Sex', ''].map((d, i) => (
              <span key={i} className="h-[11px] font-mono text-[8px] leading-[11px] text-faint">
                {d}
              </span>
            ))}
          </div>
          {weeks.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <span
                  key={cell.iso}
                  title={
                    cell.future
                      ? ''
                      : `${cell.iso} — ${cell.minutes > 0 ? `${cell.minutes} min` : 'sem estudo'}`
                  }
                  className="h-[11px] w-[11px] rounded-[2px]"
                  style={{
                    background: cell.future ? 'transparent' : bg(level(cell.minutes)),
                    border: cell.future ? 'none' : '1px solid color-mix(in srgb, var(--border) 60%, transparent)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-end gap-1 pr-1">
          <span className="font-mono text-[8px] text-faint">menos</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="h-[9px] w-[9px] rounded-[2px]"
              style={{
                background: bg(l),
                border: '1px solid color-mix(in srgb, var(--border) 60%, transparent)',
              }}
            />
          ))}
          <span className="font-mono text-[8px] text-faint">mais</span>
        </div>
      </div>
    </div>
  )
}

function Briefing({ lancamentos }: { lancamentos: Lancamento[] }) {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  const todayKey = `briefing:${today}`
  const [state, setState] = useState<
    | { status: 'idle' | 'loading' }
    | { status: 'ready'; text: string; fresh: boolean }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  useEffect(() => {
    // 1) Cache local (rápido, apenas temporário)
    const stored = loadString(todayKey)
    if (stored) setState({ status: 'ready', text: stored, fresh: false })
    // 2) Banco de dados = fonte oficial
    if (user) {
      fetchDailyBriefing(user.id, today).then((dbText) => {
        if (!dbText) return
        saveString(todayKey, dbText)
        setState({ status: 'ready', text: dbText, fresh: false })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function generate() {
    setState({ status: 'loading' })
    const summary = ROTATION_ORDER.map((discId) =>
      disciplineTopicsWithMastery(lancamentos, discId)
        .map(
          (t) =>
            `${CURRICULUM[discId].name} > ${t.name}: ${
              t.mastery === null ? 'sem dados' : t.mastery + '%'
            } (peso ${t.fib})`
        )
        .join('\n')
    ).join('\n')
    try {
      const text = await generateAI({ kind: 'briefing', summary })
      setState({ status: 'ready', text, fresh: true })
      saveString(todayKey, text)
      if (user) await upsertDailyBriefing(user.id, today, text)
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }


  return (
    <div className="rounded-xl border border-primary/30 bg-card p-4 min-h-[220px] flex flex-col transition-all duration-300 ease-in-out">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles size={13} className="text-primary" />
        <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-primary">
          BRIEFING DO AGENTE
        </span>
      </div>
      {state.status === 'idle' && (
        <button
          onClick={generate}
          className="w-full rounded-lg bg-primary py-2.5 font-display text-xs font-bold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
        >
          Gerar análise personalizada
        </button>
      )}
      {state.status === 'loading' && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="text-[11px] text-faint">Analisando seu desempenho…</span>
        </div>
      )}
      {state.status === 'error' && (
        <div>
          <p className="mb-1 text-xs text-primary">Erro ao gerar.</p>
          <p className="mb-2 break-words font-mono text-[10px] text-faint">{state.message}</p>
          <button onClick={generate} className="text-xs text-primary transition hover:underline">
            Tentar novamente
          </button>
        </div>
      )}
      {state.status === 'ready' && (
        <>
          <TypewriterMarkdown text={state.text} animate={state.fresh} />
          <button
            onClick={generate}
            className="mt-3 flex items-center gap-1 text-[11px] text-faint transition hover:text-muted-foreground"
          >
            <RefreshCw size={11} /> Gerar novamente
          </button>
        </>
      )}
    </div>
  )
}

function CicloViewInner({ lancamentos, skips = {}, onOpenMaterial, onConcluir }: Props) {
  const cycleStats = useMemo(() => computeCycleStats(lancamentos), [lancamentos])
  const cycleNumber = cycleStats.completedCycles + 1
  const heroDiscId = useMemo(() => nextHeroDiscipline(lancamentos, skips), [lancamentos, skips])
  const [selectedDiscId, setSelectedDiscId] = useState(heroDiscId)

  // Rotação automática: ao concluir uma sessão, o "herói" avança na sequência
  // e a disciplina selecionada acompanha a recomendação.
  useEffect(() => {
    setSelectedDiscId(heroDiscId)
  }, [heroDiscId])

  const heroTopics = useMemo(() => {
    const all = disciplineTopicsWithMastery(lancamentos, selectedDiscId)
    const active = selectActiveTopics(all, selectedDiscId, lancamentos)
    return allocateMinutes(active)
  }, [lancamentos, selectedDiscId])
  const maxCount = maxTopicsForDiscipline(
    useMemo(() => disciplineTopicsWithMastery(lancamentos, selectedDiscId), [lancamentos, selectedDiscId])
  )

  const streak = useMemo(() => computeStreak(lancamentos), [lancamentos])

  // Agregações em uma única passada sobre os lançamentos.
  const totals = useMemo(() => {
    let q = 0
    let a = 0
    let m = 0
    const days = new Set<string>()
    for (const l of lancamentos) {
      q += l.quantidade
      a += l.acertos
      m += l.minutos || 0
      days.add(l.data)
    }
    return {
      totalQ: q,
      totalA: a,
      totalMin: m,
      pctGlobal: q > 0 ? Math.round((a / q) * 100) : 0,
      diasEstudados: days.size,
      qHora: m > 0 ? (q / (m / 60)).toFixed(1) : '0.0',
    }
  }, [lancamentos])
  const { totalQ, totalMin, pctGlobal, diasEstudados, qHora } = totals

  const tocados = useMemo(() => {
    let n = 0
    for (const discId of Object.keys(CURRICULUM)) {
      for (const t of CURRICULUM[discId].topics) {
        if (movingAverageMastery(lancamentos, discId, t.id) !== null) n++
      }
    }
    return n
  }, [lancamentos])

  const dominadoTopic = heroTopics.find((t) => tierInfo(t.mastery).key === 'dominado')
  const recipient = [...heroTopics]
    .filter((t) => tierInfo(t.mastery).key !== 'dominado')
    .sort((a, b) => b.minutes - a.minutes)[0]
  const isHero = selectedDiscId === heroDiscId

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* Coluna esquerda: roda + métricas */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel icon={Target}>MAPA DO CICLO</SectionLabel>
          <StudyWheel
            lancamentos={lancamentos}
            activeDiscId={heroDiscId}
            lockInactive
          />
          <p className="mt-2 text-center text-[11px] text-faint">
            Apenas a disciplina em destaque está liberada. As demais ficam travadas até você
            concluir ou pular a atual no Núcleo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Dias estudados" value={diasEstudados} icon={CalendarDays} accent="var(--primary)" />
          <StatCard label="Horas estudadas" value={`${(totalMin / 60).toFixed(1)}h`} icon={Clock} accent="var(--tier-mid)" />
          <StatCard label="Assuntos" value={`${tocados}/${ALL_TOPICS_COUNT}`} icon={BookOpen} accent="var(--tier-good)" />
          <StatCard label="Questões" value={totalQ} icon={ClipboardCheck} accent="#4a86c7" />
          <StatCard label="Taxa de acertos" value={`${pctGlobal}%`} icon={Gauge} accent="var(--success)" />
          <StatCard label="Questões/hora" value={qHora} icon={Zap} accent="var(--tier-mid)" />
        </div>
      </div>

      {/* Coluna direita: frequência, sessão ativa, briefing */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel icon={Flame}>FREQUÊNCIA DE ESTUDOS</SectionLabel>
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Flame size={12} className={streak > 0 ? 'text-primary' : 'text-faint'} />
              {streak} {streak === 1 ? 'dia' : 'dias'} sem falhar
            </span>
          </div>
          <Heatmap lancamentos={lancamentos} />
        </div>

        {/* Sessão recomendada */}
        <div className="rounded-2xl border border-primary/40 bg-card p-5 glow-primary h-[640px] flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-[0.14em] text-primary">
                  {isHero ? 'PRÓXIMA NA SEQUÊNCIA' : 'INSPECIONANDO'}
                </span>
              </div>
              <div className="font-display text-xl font-bold uppercase tracking-wide text-foreground text-balance line-clamp-2 min-h-[3.5rem]">
                {CURRICULUM[selectedDiscId].name}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                {typeof CURRICULUM[selectedDiscId].questoes === 'number'
                  ? `${CURRICULUM[selectedDiscId].questoes} questões na prova`
                  : 'fase eliminatória'}{' '}
                · {heroTopics.length} tópico{heroTopics.length > 1 ? 's' : ''} · ciclo {cycleNumber}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1">
              <Clock size={12} className="text-muted-foreground" />
              <span className="font-mono text-xs font-medium text-foreground">60′</span>
            </div>
          </div>

          <AmmoBelt topics={heroTopics} height={40} />

          <div className="mt-4 space-y-2 min-h-[168px]">
            {heroTopics.map((t) => {
              const tier = tierInfo(t.mastery)
              const Ico = tier.key === 'dominado' ? CheckCircle2 : Circle
              return (
                <div key={t.id} className="flex items-center gap-2 min-w-0">
                  <Ico size={14} style={{ color: tier.token }} className="shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-xs font-medium text-muted-foreground">
                    {t.name}
                  </span>
                  <PesoBadge value={t.fib} />
                  <span
                    className="w-16 shrink-0 text-right font-mono text-[10px]"
                    style={{ color: tier.token }}
                  >
                    {tier.key === 'sem-dados' ? 'sem dados' : `${t.mastery}%`}
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-[10px] text-foreground">
                    {t.minutes}′
                  </span>
                  <IconTip label="Abrir materiais deste tópico" side="left">
                    <button
                      onClick={() => onOpenMaterial(selectedDiscId, t.id)}
                      className="shrink-0 rounded-sm p-1 text-primary transition-transform duration-200 hover:scale-125 active:scale-95"
                      aria-label="Material de estudo"
                    >
                      <FileText size={12} />
                    </button>
                  </IconTip>
                </div>
              )
            })}
          </div>

          {dominadoTopic && recipient && dominadoTopic.id !== recipient.id && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-tier-mastered/40 bg-tier-mastered/15 px-2.5 py-2">
              <Award size={13} className="mt-px shrink-0 text-tier-good" />
              <span className="text-[11px] leading-snug text-muted-foreground">
                {dominadoTopic.name} está dominado — tempo realocado para {recipient.name}.
              </span>
            </div>
          )}
          {heroTopics.length < maxCount && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-2">
              <Sparkles size={13} className="mt-px shrink-0 text-primary" />
              <span className="text-[11px] leading-snug text-muted-foreground">
                No ciclo {cycleNumber}, até {maxCount} tópico{maxCount > 1 ? 's' : ''} podem dividir
                essa hora — ainda há espaço para mais um assim que você avançar.
              </span>
            </div>
          )}

          <div className="mt-3 rounded-lg border border-border-soft bg-secondary p-3">
            <div className="mb-1 font-mono text-[9px] tracking-[0.14em] text-faint">
              MOTIVO DA RECOMENDAÇÃO
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              A alocação prioriza tópicos de maior peso no edital e menor domínio. Os minutos são
              distribuídos automaticamente conforme seu histórico de acertos — quanto mais fraco o
              tópico, mais tempo ele recebe.
            </p>
          </div>

          <button
            onClick={() => onConcluir(selectedDiscId)}
            className="mt-auto pt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-wide text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-95"
          >
            <PlayCircle size={16} />
            Concluir estudo
          </button>
        </div>

        <Briefing lancamentos={lancamentos} />
      </div>
    </div>
  )
}

export const CicloView = memo(CicloViewInner)
