import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, Loader2, SkipForward, X } from 'lucide-react'
import { CURRICULUM, ROTATION_ORDER, movingAverageMastery, type Lancamento } from '@/lib/curriculum'
import { gerarFlashcards, type Flashcard } from '@/lib/ai.functions'
import { fetchAiMaterial, upsertAiMaterial } from '@/lib/db'
import { useAuth } from '@/lib/auth-context'
import { SectionLabel } from '@/components/ui-bits'

const DUE_DAYS = 7
const today = () => new Date().toISOString().slice(0, 10)
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

type Item = { discId: string; topicId: string; dias: number | null; prio: number }

/** Assuntos não vistos há 7+ dias ou nunca vistos, ordenados por peso × fraqueza. */
export function flashcardQueue(lancamentos: Lancamento[], hoje = today()): Item[] {
  const last = new Map<string, string>()
  for (const l of lancamentos) {
    const k = `${l.disciplinaId}::${l.topicoId}`
    const p = last.get(k)
    if (!p || l.data > p) last.set(k, l.data)
  }
  const out: Item[] = []
  for (const discId of ROTATION_ORDER) {
    for (const t of CURRICULUM[discId].topics) {
      const d = last.get(`${discId}::${t.id}`)
      const dias = d ? daysBetween(hoje, d) : null
      if (dias !== null && dias < DUE_DAYS) continue
      const m = movingAverageMastery(lancamentos, discId, t.id)
      const fraqueza = m === null ? 1 : 1 - m / 100
      out.push({ discId, topicId: t.id, dias, prio: t.fib * (0.5 + fraqueza) })
    }
  }
  return out.sort((a, b) => b.prio - a.prio)
}

type Props = {
  lancamentos: Lancamento[]
  onAdd: (l: Omit<Lancamento, 'id'>) => Promise<void>
}

export function FlashcardsView({ lancamentos, onAdd }: Props) {
  const { user } = useAuth()
  const queue = useMemo(() => flashcardQueue(lancamentos), [lancamentos])
  const [current, setCurrent] = useState<Item | null>(null)
  const [skipped, setSkipped] = useState<string[]>([])
  const [cards, setCards] = useState<Flashcard[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [escolha, setEscolha] = useState<number | null>(null)
  const [revelado, setRevelado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [placar, setPlacar] = useState({ acertos: 0, erros: 0 })

  useEffect(() => {
    if (current) return
    const next = queue.find((q) => !skipped.includes(`${q.discId}::${q.topicId}`))
    if (next) setCurrent(next)
  }, [queue, current, skipped])

  useEffect(() => {
    if (!current || !user) return
    let alive = true
    setCards(null); setIdx(0); setEscolha(null); setRevelado(false); setErro(null); setLoading(true)
    const disc = CURRICULUM[current.discId]
    const topic = disc.topics.find((t) => t.id === current.topicId)!
    ;(async () => {
      try {
        const cached = await fetchAiMaterial(user.id, current.discId, current.topicId, 'flashcards')
        if (cached) {
          const parsed = JSON.parse(cached) as Flashcard[]
          if (alive && parsed.length) { setCards(parsed); return }
        }
        const r = await gerarFlashcards({ data: { discName: disc.name, topicName: topic.name } })
        if ('error' in r) throw new Error(r.error)
        await upsertAiMaterial(user.id, current.discId, current.topicId, 'flashcards', JSON.stringify(r.cards))
        if (alive) setCards(r.cards)
      } catch (e) {
        if (alive) setErro(e instanceof Error ? e.message : 'Erro ao gerar flashcards.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [current, user])

  const proximoTopico = () => {
    if (current) setSkipped((s) => [...s, `${current.discId}::${current.topicId}`])
    setCurrent(null)
  }

  const mostrar = async () => {
    if (escolha === null || !cards || !current) return
    setRevelado(true)
    const acertou = escolha === cards[idx].correta
    setPlacar((p) => ({ acertos: p.acertos + (acertou ? 1 : 0), erros: p.erros + (acertou ? 0 : 1) }))
    await onAdd({
      disciplinaId: current.discId,
      topicoId: current.topicId,
      quantidade: 1,
      acertos: acertou ? 1 : 0,
      minutos: 1,
      data: today(),
    })
  }

  const avancar = () => {
    if (!cards) return
    if (idx + 1 < cards.length) { setIdx(idx + 1); setEscolha(null); setRevelado(false) }
    else proximoTopico()
  }

  const pendentes = queue.filter((q) => !skipped.includes(`${q.discId}::${q.topicId}`)).length
  const disc = current ? CURRICULUM[current.discId] : null
  const topic = disc?.topics.find((t) => t.id === current?.topicId)
  const card = cards?.[idx]

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Assuntos para revisar" value={String(pendentes)} />
        <Stat label="Acertos" value={String(placar.acertos)} className="text-tier-high" />
        <Stat label="Erros" value={String(placar.erros)} className="text-destructive" />
      </div>

      {!current ? (
        <div className="rounded-2xl border border-border-soft bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum assunto parado há 7 dias ou mais. Tudo revisado!
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/30 bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionLabel>{disc?.name}</SectionLabel>
              <h2 className="font-display text-base font-bold text-foreground">{topic?.name}</h2>
              <p className="text-[11px] text-faint">
                {current.dias === null ? 'Nunca visto' : `Visto há ${current.dias} dias`}
                {cards && ` · Card ${idx + 1} de ${cards.length}`}
              </p>
            </div>
            <button
              onClick={proximoTopico}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border-soft px-2.5 py-1.5 text-[11px] text-muted-foreground transition hover:text-foreground"
            >
              <SkipForward size={12} /> Pular assunto
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Gerando flashcards…
            </div>
          )}
          {erro && (
            <div className="py-6 text-sm text-destructive">
              {erro}{' '}
              <button onClick={() => { const c = current; setCurrent(null); setTimeout(() => setCurrent(c), 0) }} className="underline">
                Tentar de novo
              </button>
            </div>
          )}

          {card && !loading && (
            <div className="mt-4 space-y-3">
              <p className="text-[15px] font-medium leading-relaxed text-foreground">{card.pergunta}</p>
              {card.alternativas.map((alt, i) => {
                const sel = escolha === i
                const certa = revelado && i === card.correta
                const errada = revelado && sel && i !== card.correta
                return (
                  <button
                    key={i}
                    disabled={revelado}
                    onClick={() => setEscolha(i)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-[13px] transition ${
                      certa
                        ? 'border-tier-high bg-tier-high/10'
                        : errada
                          ? 'border-destructive bg-destructive/10'
                          : sel
                            ? 'border-primary bg-primary/10'
                            : 'border-border-soft bg-secondary hover:border-primary/40'
                    }`}
                  >
                    <span className="font-mono font-bold text-primary">{i === 0 ? 'A' : 'B'}</span>
                    <span className="flex-1 text-foreground">{alt}</span>
                    {certa && <Check size={16} className="text-tier-high" />}
                    {errada && <X size={16} className="text-destructive" />}
                  </button>
                )
              })}

              {!revelado ? (
                <button
                  onClick={mostrar}
                  disabled={escolha === null}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
                >
                  <Eye size={14} /> Mostrar resposta
                </button>
              ) : (
                <>
                  <div
                    className={`rounded-lg border p-3 text-[13px] ${
                      escolha === card.correta ? 'border-tier-high/40 bg-tier-high/5' : 'border-destructive/40 bg-destructive/5'
                    }`}
                  >
                    <p className="font-bold text-foreground">
                      {escolha === card.correta ? 'Você acertou!' : `Você errou — correta: ${card.correta === 0 ? 'A' : 'B'}`}
                    </p>
                    {card.explicacao && <p className="mt-1 text-muted-foreground">{card.explicacao}</p>}
                  </div>
                  <button
                    onClick={avancar}
                    className="w-full rounded-lg border border-primary/40 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                  >
                    {cards && idx + 1 < cards.length ? 'Próximo card' : 'Próximo assunto'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold text-foreground ${className}`}>{value}</div>
    </div>
  )
}
