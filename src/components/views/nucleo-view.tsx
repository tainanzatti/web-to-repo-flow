import { memo, useMemo, useState } from 'react'
import {
  ChevronDown,
  FileText,
  Lock,
  Repeat,
  PenLine,
  PlayCircle,
  SkipForward,
  AlertTriangle,
  Crosshair,
} from 'lucide-react'
import {
  CURRICULUM,
  ROTATION_ORDER,
  targetViews,
  viewCount,
  lerpColor,
  tierInfo,
  movingAverageMastery,
  nextHeroDiscipline,
  disciplineScore,
  explainPriority,
  type DisciplineSkips,
  type Lancamento,
} from '@/lib/curriculum'
import { IconTip } from '@/components/ui-bits'

type Props = {
  lancamentos: Lancamento[]
  skips?: DisciplineSkips
  onOpenMaterial: (discId: string, topicId: string) => void
  onEstudar?: (discId: string) => void
  onSkip?: (discId: string) => void | Promise<void>
}

// Cor fria (poucas revisões) -> quente (meta atingida): azul -> verde
function reviewColor(count: number, target: number): string {
  const t = Math.min(1, count / target)
  return lerpColor('#3b6fb5', '#2f9e5f', t)
}

function NucleoViewInner({
  lancamentos,
  skips = {},
  onOpenMaterial,
  onEstudar,
  onSkip,
}: Props) {
  const activeDiscId = useMemo(
    () => nextHeroDiscipline(lancamentos, skips),
    [lancamentos, skips]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border-soft bg-card px-4 py-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
          Progresso de revisão
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-16 rounded-sm bg-gradient-to-r from-[#3b6fb5] to-[#2f9e5f]" />
          <span className="text-[11px] text-muted-foreground">poucas → meta atingida</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-faint">
          <Lock size={11} /> disciplinas travadas até a ativa ser concluída
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ROTATION_ORDER.map((discId) =>
          discId === activeDiscId ? (
            <ActiveDisciplineCard
              key={discId}
              discId={discId}
              lancamentos={lancamentos}
              skips={skips}
              onOpenMaterial={onOpenMaterial}
              onEstudar={onEstudar}
              onSkip={onSkip}
            />
          ) : (
            <LockedDisciplineCard key={discId} discId={discId} lancamentos={lancamentos} />
          )
        )}
      </div>
    </div>
  )
}

// ============================ Disciplina ativa ============================

function ActiveDisciplineCard({
  discId,
  lancamentos,
  skips,
  onOpenMaterial,
  onEstudar,
  onSkip,
}: {
  discId: string
  lancamentos: Lancamento[]
  skips: DisciplineSkips
  onOpenMaterial: (discId: string, topicId: string) => void
  onEstudar?: (discId: string) => void
  onSkip?: (discId: string) => void | Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const [confirmSkip, setConfirmSkip] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const disc = CURRICULUM[discId]
  const isRedacao = discId === 'redacao'
  const score = useMemo(
    () => disciplineScore(lancamentos, discId, skips),
    [lancamentos, discId, skips]
  )
  const vezesPulada = skips[discId]?.skipCount ?? 0

  async function handleSkip() {
    if (!onSkip) return
    setSkipping(true)
    try {
      await onSkip(discId)
      setConfirmSkip(false)
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card ${
        isRedacao
          ? 'border-dashed border-primary/50 bg-primary/[0.04]'
          : 'border-primary/60 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_25%,transparent)]'
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-card-raised"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
            {isRedacao ? (
              <PenLine size={14} className="text-primary" />
            ) : (
              <Crosshair size={14} className="text-primary" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-foreground">{disc.name}</span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                {isRedacao ? 'Fase 2' : 'Ativa agora'}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{explainPriority(score)}</p>
          </div>
        </div>
        <ChevronDown
          size={15}
          className={`shrink-0 text-faint transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border-soft px-4 py-4">
          <div className="rounded-lg border border-border-soft bg-card-raised px-3 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
              Por que esta disciplina
            </span>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {explainPriority(score)}.
            </p>
            {vezesPulada > 0 && (
              <p className="mt-1 font-mono text-[10px] text-tier-mid">
                Registrada como pulada {vezesPulada}× no total.
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            {disc.topics.map((t) => {
              const count = viewCount(lancamentos, discId, t.id)
              const target = targetViews(t.fib)
              const mastery = movingAverageMastery(lancamentos, discId, t.id)
              const started = count > 0
              const color = reviewColor(count, target)
              const tier = tierInfo(mastery)
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-border-soft bg-card p-3 transition hover:border-border"
                >
                  <div className="mb-2.5 flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: started ? color : 'transparent',
                        border: started ? 'none' : '1.5px solid var(--faint)',
                      }}
                    />
                    <span className="text-[13px] font-medium leading-snug text-foreground text-pretty">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Repeat size={11} />
                        {count}
                        <span className="text-faint">/{target}</span>
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: tier.token }}>
                        {mastery === null ? 'sem dados' : `${mastery}% · ${tier.label}`}
                      </span>
                    </div>
                    <IconTip label="Abrir materiais deste tópico" side="left">
                      <button
                        onClick={() => onOpenMaterial(discId, t.id)}
                        aria-label="Material de estudo"
                        className="rounded p-1 text-primary transition hover:scale-125"
                      >
                        <FileText size={13} />
                      </button>
                    </IconTip>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-card-raised">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (count / target) * 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              onClick={() => onEstudar?.(discId)}
              disabled={!onEstudar}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <PlayCircle size={14} />
              Estudar esta disciplina
            </button>
            {onSkip && !confirmSkip && (
              <button
                onClick={() => setConfirmSkip(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-border-soft px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
              >
                <SkipForward size={14} />
                Pular esta disciplina
              </button>
            )}
          </div>

          {confirmSkip && onSkip && (
            <div className="rounded-lg border border-tier-mid/50 bg-tier-mid/[0.07] p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-tier-mid" />
                <p className="text-[12px] leading-relaxed text-foreground">
                  Pular não te livra dela — ela volta com prioridade maior e fica registrado.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSkip}
                  disabled={skipping}
                  className="rounded-lg bg-tier-mid px-3 py-2 text-[12px] font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
                >
                  {skipping ? 'Registrando…' : 'Confirmar pulo'}
                </button>
                <button
                  onClick={() => setConfirmSkip(false)}
                  className="rounded-lg border border-border-soft px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================ Disciplinas travadas ============================

function LockedDisciplineCard({
  discId,
  lancamentos,
}: {
  discId: string
  lancamentos: Lancamento[]
}) {
  const disc = CURRICULUM[discId]
  const isRedacao = discId === 'redacao'
  const done = disc.topics.filter((t) => viewCount(lancamentos, discId, t.id) > 0).length

  return (
    <div
      aria-disabled
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 opacity-55 ${
        isRedacao ? 'border-dashed border-border-soft bg-card' : 'border-border-soft bg-card'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card-raised">
          {isRedacao ? (
            <PenLine size={14} className="text-faint" />
          ) : (
            <Lock size={13} className="text-faint" />
          )}
        </span>
        <div className="min-w-0">
          <span className="font-display text-sm font-semibold text-muted-foreground">
            {disc.name}
          </span>
          <p className="text-[11px] text-faint">
            {isRedacao ? 'Fase 2 — tratamento próprio · ' : ''}
            {done}/{disc.topics.length} tópicos iniciados
          </p>
        </div>
      </div>
      <Lock size={13} className="shrink-0 text-faint" />
    </div>
  )
}

export const NucleoView = memo(NucleoViewInner)
