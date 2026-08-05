import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, X, Check } from 'lucide-react'
import { CURRICULUM, type AllocatedTopic } from '@/lib/curriculum'

type Props = {
  discId: string
  topics: AllocatedTopic[]
  onClose: () => void
  onConcluir: () => void
}

function fmt(total: number) {
  const s = Math.max(0, total)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function FocusMode({ discId, topics, onClose, onConcluir }: Props) {
  const list = useMemo(() => (topics.length > 0 ? topics : []), [topics])
  const [idx, setIdx] = useState(0)
  const current = list[idx]
  const totalSeconds = (current?.minutes ?? 25) * 60

  const [left, setLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState<string[]>([])
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setLeft(totalSeconds)
    setRunning(false)
  }, [totalSeconds, idx])

  useEffect(() => {
    if (!running) return
    tick.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => {
      if (tick.current) clearInterval(tick.current)
    }
  }, [running])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        setRunning((r) => !r)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const pct = totalSeconds > 0 ? 1 - left / totalSeconds : 0
  const R = 130
  const C = 2 * Math.PI * R

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Modo foco
          </div>
          <div className="truncate font-display text-sm font-bold text-foreground">
            {CURRICULUM[discId]?.name ?? discId}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Sair do modo foco"
          className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-10">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Tópico {list.length > 0 ? idx + 1 : 0}/{list.length}
          </p>
          <h2 className="mt-1 max-w-xl text-balance font-display text-xl font-bold text-foreground">
            {current?.name ?? 'Sem tópicos alocados'}
          </h2>
        </div>

        <div className="relative">
          <svg width={300} height={300} viewBox="0 0 300 300">
            <circle
              cx={150}
              cy={150}
              r={R}
              fill="none"
              stroke="var(--card-raised)"
              strokeWidth={10}
            />
            <circle
              cx={150}
              cy={150}
              r={R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 150 150)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-bold tabular-nums text-foreground">
              {fmt(left)}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-faint">
              {current ? `${current.minutes} min alocados` : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? 'Pausar' : left === 0 ? 'Reiniciar' : 'Iniciar'}
          </button>
          <button
            onClick={() => {
              setRunning(false)
              setLeft(totalSeconds)
            }}
            aria-label="Zerar cronômetro"
            className="rounded-xl border border-border p-3 text-muted-foreground transition hover:text-primary"
          >
            <RotateCcw size={16} />
          </button>
          {current && (
            <button
              onClick={() => {
                setDone((d) => (d.includes(current.id) ? d : [...d, current.id]))
                if (idx < list.length - 1) setIdx(idx + 1)
              }}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-primary"
            >
              <Check size={16} />
              Concluir tópico
            </button>
          )}
        </div>

        {list.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {list.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setIdx(i)}
                className="rounded-full px-3 py-1 font-mono text-[10px] transition"
                style={{
                  background:
                    i === idx
                      ? 'color-mix(in srgb, var(--primary) 18%, transparent)'
                      : 'var(--card-raised)',
                  color: i === idx ? 'var(--primary)' : 'var(--muted-foreground)',
                  textDecoration: done.includes(t.id) ? 'line-through' : 'none',
                }}
              >
                {t.name.length > 26 ? `${t.name.slice(0, 26)}…` : t.name} · {t.minutes}m
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onConcluir}
          className="text-[12px] text-faint underline underline-offset-4 transition hover:text-primary"
        >
          Registrar resultado da hora
        </button>
      </div>
    </div>
  )
}
