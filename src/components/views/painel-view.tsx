import { memo, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  Clock,
  Crosshair,
  Layers,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  ALL_TOPICS_COUNT,
  CURRICULUM,
  ROTATION_ORDER,
  disciplineScore,
  explainPriority,
  movingAverageMastery,
  nextHeroDiscipline,
  tierInfo,
  type DisciplineSkips,
  type Lancamento,
} from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'
import { useAuth } from '@/lib/auth-context'

type Props = {
  lancamentos: Lancamento[]
  skips?: DisciplineSkips
  onEstudar: (discId: string) => void
  onVerNucleo: () => void
  onOpenMaterial: (discId: string, topicId: string) => void
}

const REVIEW_DUE_DAYS = 7
const today = () => new Date().toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

function PainelViewInner({ lancamentos, skips = {}, onEstudar, onVerNucleo, onOpenMaterial }: Props) {
  const { profile, user } = useAuth()
  const [horasDia, setHorasDia] = useState(2)

  const stats = useMemo(() => {
    const hoje = today()
    const minutosHoje = lancamentos
      .filter((l) => l.data === hoje)
      .reduce((a, l) => a + l.minutos, 0)
    const minutosTotais = lancamentos.reduce((a, l) => a + l.minutos, 0)
    const q = lancamentos.reduce((a, l) => a + l.quantidade, 0)
    const ac = lancamentos.reduce((a, l) => a + l.acertos, 0)
    const aproveitamento = q > 0 ? Math.round((ac / q) * 100) : null

    let bons = 0
    for (const discId of ROTATION_ORDER) {
      for (const t of CURRICULUM[discId].topics) {
        const m = movingAverageMastery(lancamentos, discId, t.id)
        const key = tierInfo(m).key
        if (key === 'bom' || key === 'dominado') bons++
      }
    }

    return {
      minutosHoje,
      minutosTotais,
      aproveitamento,
      pctEditalBom: Math.round((bons / ALL_TOPICS_COUNT) * 100),
    }
  }, [lancamentos])

  // Primeiro contato com cada tópico: data + minutos gastos na estreia.
  const firstTouch = useMemo(() => {
    const map = new Map<string, { data: string; minutos: number }>()
    for (const l of lancamentos) {
      const key = `${l.disciplinaId}::${l.topicoId}`
      const prev = map.get(key)
      if (!prev || l.data < prev.data) map.set(key, { data: l.data, minutos: l.minutos })
    }
    return map
  }, [lancamentos])

  const projecao = useMemo(() => {
    const tocados = firstTouch.size
    const restantes = Math.max(0, ALL_TOPICS_COUNT - tocados)

    const hoje = today()
    const novosUltimos30 = [...firstTouch.values()].filter(
      (f) => daysBetween(hoje, f.data) <= 30,
    ).length
    const ritmoDia = novosUltimos30 / 30

    const minutosPorTopicoNovo =
      tocados > 0
        ? [...firstTouch.values()].reduce((a, f) => a + f.minutos, 0) / tocados
        : 60

    const diasRitmoAtual = ritmoDia > 0 ? Math.ceil(restantes / ritmoDia) : null
    const topicosPorDiaHipotetico = (horasDia * 60) / minutosPorTopicoNovo
    const diasHipotetico =
      topicosPorDiaHipotetico > 0 ? Math.ceil(restantes / topicosPorDiaHipotetico) : null

    return { tocados, restantes, diasRitmoAtual, minutosPorTopicoNovo, diasHipotetico }
  }, [firstTouch, horasDia])

  const revisoesVencendo = useMemo(() => {
    const hoje = today()
    const last = new Map<string, string>()
    for (const l of lancamentos) {
      const key = `${l.disciplinaId}::${l.topicoId}`
      const prev = last.get(key)
      if (!prev || l.data > prev) last.set(key, l.data)
    }
    return [...last.entries()]
      .map(([key, data]) => {
        const [discId, topicId] = key.split('::')
        return { discId, topicId, dias: daysBetween(hoje, data) }
      })
      .filter((r) => r.dias >= REVIEW_DUE_DAYS && CURRICULUM[r.discId])
      .sort((a, b) => b.dias - a.dias)
  }, [lancamentos])

  const heroId = useMemo(() => nextHeroDiscipline(lancamentos, skips), [lancamentos, skips])
  const heroScore = useMemo(
    () => disciplineScore(lancamentos, heroId, skips),
    [lancamentos, heroId, skips],
  )
  const hero = CURRICULUM[heroId]

  const preview = useMemo(
    () =>
      ROTATION_ORDER.map((d) => disciplineScore(lancamentos, d, skips))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4),
    [lancamentos, skips],
  )

  const nome = (
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    'candidato'
  ).split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">
      {/* Comando do dia */}
      <div className="rounded-2xl border border-primary/30 bg-card p-5">
        <SectionLabel>ORDEM DO DIA</SectionLabel>
        <h2 className="font-display text-xl font-bold text-foreground">
          {saudacao}, {nome}.
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{hero.name}</span> é a prioridade agora —{' '}
          60 min recomendados.
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">{explainPriority(heroScore)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onEstudar(heroId)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110"
          >
            <Crosshair size={14} /> Estudar agora
          </button>
          <button
            onClick={onVerNucleo}
            className="flex items-center gap-2 rounded-lg border border-border-soft px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            Ver Núcleo <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Horas hoje"
          value={`${(stats.minutosHoje / 60).toFixed(1)}h`}
        />
        <StatCard
          icon={TrendingUp}
          label="Horas totais"
          value={`${(stats.minutosTotais / 60).toFixed(1)}h`}
        />
        <StatCard
          icon={Target}
          label="Aproveitamento"
          value={stats.aproveitamento === null ? '—' : `${stats.aproveitamento}%`}
        />
        <StatCard
          icon={Layers}
          label="Edital com domínio bom+"
          value={`${stats.pctEditalBom}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Prévia do Núcleo */}
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>PRÉVIA DO NÚCLEO</SectionLabel>
            <button
              onClick={onVerNucleo}
              className="mb-2 text-[11px] font-medium text-primary transition hover:brightness-125"
            >
              Ver tudo
            </button>
          </div>
          <div className="space-y-2">
            {preview.map((s, i) => {
              const t = tierInfo(s.dominio)
              return (
                <div
                  key={s.discId}
                  className="flex items-center gap-3 rounded-lg border border-border-soft bg-secondary px-3 py-2.5"
                >
                  <span className="font-mono text-[10px] text-faint">{i + 1}º</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                    {CURRICULUM[s.discId].name}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: t.token, backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
                  >
                    {s.dominio === null ? 'Sem dados' : `${s.dominio}%`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revisões vencendo */}
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>REVISÕES VENCENDO</SectionLabel>
            <span className="mb-2 rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
              {revisoesVencendo.length} pendentes hoje
            </span>
          </div>
          {revisoesVencendo.length === 0 ? (
            <p className="text-[12px] text-faint">
              Nenhuma revisão vencida — tudo em dia por aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {revisoesVencendo.slice(0, 5).map((r) => {
                const disc = CURRICULUM[r.discId]
                const topico = disc.topics.find((t) => t.id === r.topicId)
                return (
                  <button
                    key={`${r.discId}-${r.topicId}`}
                    onClick={() => onOpenMaterial(r.discId, r.topicId)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border-soft bg-secondary px-3 py-2.5 text-left transition hover:border-primary/40"
                  >
                    <CalendarClock size={14} className="shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {topico?.name ?? r.topicId}
                      </span>
                      <span className="block truncate text-[10px] text-faint">{disc.name}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-primary">
                      {r.dias}d
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Projeção de cobertura */}
      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>PROJEÇÃO DE COBERTURA</SectionLabel>
        <p className="text-sm text-foreground">
          {projecao.restantes === 0 ? (
            'Você já teve o primeiro contato com todos os tópicos do edital.'
          ) : projecao.diasRitmoAtual === null ? (
            <>
              Ainda não há ritmo suficiente para projetar. Faltam{' '}
              <strong>{projecao.restantes}</strong> tópicos sem primeiro contato.
            </>
          ) : (
            <>
              No seu ritmo atual, você verá todos os tópicos pela primeira vez em{' '}
              <strong className="text-primary">{projecao.diasRitmoAtual} dias</strong> (
              {projecao.restantes} tópicos restantes).
            </>
          )}
        </p>

        <div className="mt-5 rounded-xl border border-border-soft bg-secondary p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-muted-foreground">
              E se eu estudasse{' '}
              <strong className="text-foreground">
                {horasDia}h{horasDia === 1 ? '' : ''} por dia
              </strong>
              ?
            </span>
            <span className="font-display text-sm font-bold text-primary">
              {projecao.restantes === 0
                ? 'Cobertura completa'
                : `${projecao.diasHipotetico} dias`}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={horasDia}
            onChange={(e) => setHorasDia(Number(e.target.value))}
            className="mt-3 w-full accent-[color:var(--primary)]"
            aria-label="Horas de estudo por dia"
          />
          <div className="flex justify-between font-mono text-[9px] text-faint">
            <span>1h</span>
            <span>8h</span>
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Base: {Math.round(projecao.minutosPorTopicoNovo)} min por tópico novo (sua média real).
          </p>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-faint">
          Estimativa baseada no seu ritmo médio real de estudo. Não considera revisões, apenas o
          primeiro contato com cada tópico.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-4">
      <div className="flex items-center gap-2 text-faint">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-foreground">{value}</div>
    </div>
  )
}

export const PainelView = memo(PainelViewInner)
