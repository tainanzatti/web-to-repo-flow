// ============================================================================
// Simulado — prova completa no padrão PMSC: 60 questões + redação, até 5h
// ============================================================================
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2,
  Play,
  Timer,
  History,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Send,
  RotateCcw,
  Trash2,
  Check,
  X,
  Award,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { CURRICULUM, type Lancamento } from '@/lib/curriculum'
import { gerarQuestoesSimulado } from '@/lib/simulado.functions'
import { generateAI, corrigirRedacaoAI } from '@/lib/ai-client'
import {
  SIMULADO_DISTRIBUTION,
  SIMULADO_TOTAL,
  SIMULADO_LIMIT_MIN,
  SIMULADO_PESO_OBJETIVA,
  SIMULADO_PESO_REDACAO,
  distribuirTopicos,
  calcularNotaObjetiva,
  calcularNotaFinal,
  formatTempo,
  resultadoPorDisciplina,
} from '@/lib/simulado'
import {
  fetchSimulados,
  fetchSimuladoEmAndamento,
  insertSimulado,
  updateSimulado,
  deleteSimulado,
  insertLancamentos,
  insertRedacao,
  type Simulado,
} from '@/lib/db'

import { CRITERIOS_REDACAO as CRITERIOS } from '@/lib/redacao-criterios'

function notaColor(nota: number): string {
  if (nota < 5) return 'var(--tier-weak)'
  if (nota < 7.5) return 'var(--tier-mid)'
  if (nota < 9) return 'var(--tier-good)'
  return 'var(--tier-mastered)'
}

const LETRAS = ['A', 'B', 'C', 'D'] as const
type Letra = (typeof LETRAS)[number]

export function SimuladoView({
  lancamentos,
  onLancamentosAdded,
}: {
  lancamentos: Lancamento[]
  onLancamentosAdded: (rows: Lancamento[]) => void
}) {
  const { user } = useAuth()
  const [fase, setFase] = useState<'setup' | 'gerando' | 'prova' | 'redacao' | 'resultado'>(
    'setup'
  )
  const [historico, setHistorico] = useState<Simulado[]>([])
  const [emAndamento, setEmAndamento] = useState<Simulado | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [prova, setProva] = useState<Simulado | null>(null)
  const [resultado, setResultado] = useState<Simulado | null>(null)
  const [idx, setIdx] = useState(0)
  const [progresso, setProgresso] = useState({ feitas: 0, discName: '' })
  const [gerandoErro, setGerandoErro] = useState<string | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [temaLoading, setTemaLoading] = useState(false)
  const [textoRedacao, setTextoRedacao] = useState('')
  const [corrigindo, setCorrigindo] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([fetchSimulados(user.id), fetchSimuladoEmAndamento(user.id)])
      .then(([todos, andamento]) => {
        if (cancelled) return
        setHistorico(todos.filter((s) => s.status === 'concluida'))
        setEmAndamento(andamento)
      })
      .catch((err) => console.error('Erro ao carregar simulados:', err))
      .finally(() => {
        if (!cancelled) setCarregando(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // ---------- Geração da prova ----------
  async function iniciar() {
    if (!user) return
    setFase('gerando')
    setGerandoErro(null)
    setProgresso({ feitas: 0, discName: '' })
    try {
      const all: Simulado['questoes'] = []
      for (const { discId, count } of SIMULADO_DISTRIBUTION) {
        const discName = CURRICULUM[discId].name
        const batches = distribuirTopicos(discId, count, lancamentos)
        setProgresso({ feitas: all.length, discName })
        const payload = {
          discName,
          batches: batches.map((b) => ({ topicName: b.topicoName, count: b.count })),
        }
        let res = await gerarQuestoesSimulado({ data: payload })
        if ('error' in res) res = await gerarQuestoesSimulado({ data: payload })
        if ('error' in res) throw new Error(res.error)

        const qs = res.questions.slice(0, count)
        let k = 0
        for (const b of batches) {
          for (let n = 0; n < b.count && k < qs.length; n++, k++) {
            all.push({ ...qs[k], disciplinaId: discId, topicoId: b.topicoId })
          }
        }
        while (k < qs.length) {
          all.push({ ...qs[k], disciplinaId: discId, topicoId: batches[batches.length - 1].topicoId })
          k++
        }
        setProgresso({ feitas: all.length, discName })
      }
      if (all.length < SIMULADO_TOTAL) throw new Error('Geração incompleta. Tente novamente.')
      const saved = await insertSimulado(user.id, all)
      setProva(saved)
      setIdx(0)
      setTextoRedacao('')
      setFase('prova')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setGerandoErro(msg)
      setFase('setup')
      toast.error('Não foi possível gerar o simulado. Tente novamente.')
    }
  }

  function retomar(s: Simulado) {
    setProva(s)
    setIdx(0)
    setTextoRedacao(s.redacaoTexto ?? '')
    setFase(s.notaObjetiva !== null ? 'redacao' : 'prova')
  }

  async function descartar(s: Simulado) {
    try {
      await deleteSimulado(s.id)
      setEmAndamento(null)
      toast.success('Simulado descartado.')
    } catch (err) {
      console.error('Erro ao descartar simulado:', err)
      toast.error('Não foi possível descartar o simulado.')
    }
  }

  // ---------- Cronômetro ----------
  useEffect(() => {
    if (fase !== 'prova' || !prova) return
    const inicio = new Date(prova.iniciadoEm).getTime()
    const calc = () =>
      setSegundosRestantes(SIMULADO_LIMIT_MIN * 60 - Math.floor((Date.now() - inicio) / 1000))
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [fase, prova])

  // ---------- Respostas ----------
  function responder(letra: Letra) {
    if (!prova) return
    const respostas = { ...prova.respostas, [String(idx)]: letra }
    setProva({ ...prova, respostas })
    updateSimulado(prova.id, { respostas }).catch((err) =>
      console.error('Erro ao salvar resposta:', err)
    )
  }

  async function finalizarObjetiva() {
    if (!prova) return
    setConfirmando(false)
    const acertos = prova.questoes.reduce(
      (s, q, i) => s + (prova.respostas[String(i)] === q.correta ? 1 : 0),
      0
    )
    const notaObj = calcularNotaObjetiva(acertos)
    setProva({ ...prova, notaObjetiva: notaObj })
    try {
      await updateSimulado(prova.id, { respostas: prova.respostas, notaObjetiva: notaObj })
    } catch (err) {
      console.error('Erro ao finalizar parte objetiva:', err)
    }
    setFase('redacao')
  }

  // ---------- Redação ----------
  useEffect(() => {
    if (fase !== 'redacao' || !prova || !user) return
    if (prova.redacaoTema) return
    let cancelled = false
    setTemaLoading(true)
    generateAI({ kind: 'redacao-tema' })
      .then(async (tema) => {
        if (cancelled) return
        setProva((p) => (p ? { ...p, redacaoTema: tema } : p))
        try {
          await updateSimulado(prova.id, { redacaoTema: tema })
        } catch (err) {
          console.error('Erro ao salvar tema da redação:', err)
        }
      })
      .catch((err) => {
        console.error('Erro ao gerar tema:', err)
        toast.error('Não foi possível gerar o tema da redação.')
      })
      .finally(() => {
        if (!cancelled) setTemaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fase, prova, user])

  const linhasRedacao = textoRedacao.trim()
    ? textoRedacao.split('\n').filter((l) => l.trim()).length
    : 0

  async function enviarRedacao() {
    if (!prova || !user || !prova.redacaoTema) return
    if (textoRedacao.trim().length < 200) {
      toast.error('Escreva a redação completa (mínimo ~200 caracteres) antes de enviar.')
      return
    }
    setCorrigindo(true)
    try {
      const correcao = await corrigirRedacaoAI(prova.redacaoTema, textoRedacao)
      const notaFinal = calcularNotaFinal(prova.notaObjetiva ?? 0, correcao.nota)
      const agora = new Date().toISOString()
      const hoje = new Date().toISOString().slice(0, 10)

      await insertRedacao(user.id, {
        tema: prova.redacaoTema,
        texto: textoRedacao,
        nota: correcao.nota,
        feedback: correcao.feedback as unknown as Record<string, string>,
        comentario: correcao.comentario ?? null,
      })

      // Crédito no motor: objetiva agregada por tópico + redação.
      const porTopico = new Map<string, { discId: string; qtd: number; acertos: number }>()
      prova.questoes.forEach((q, i) => {
        const v = porTopico.get(q.topicoId) ?? { discId: q.disciplinaId, qtd: 0, acertos: 0 }
        v.qtd++
        if (prova.respostas[String(i)] === q.correta) v.acertos++
        porTopico.set(q.topicoId, v)
      })
      const inicioMs = new Date(prova.iniciadoEm).getTime()
      const minutosTotais = Math.max(
        1,
        Math.min(SIMULADO_LIMIT_MIN, Math.round((Date.now() - inicioMs) / 60000))
      )
      const total = prova.questoes.length || 1
      const entries: Omit<Lancamento, 'id'>[] = []
      for (const [topicoId, v] of porTopico.entries()) {
        entries.push({
          disciplinaId: v.discId,
          topicoId,
          quantidade: v.qtd,
          acertos: v.acertos,
          minutos: Math.max(1, Math.round((minutosTotais * v.qtd) / total)),
          data: hoje,
        })
      }
      entries.push({
        disciplinaId: 'redacao',
        topicoId: 'estrutura',
        quantidade: 10,
        acertos: Math.round(correcao.nota),
        minutos: 60,
        data: hoje,
      })

      const saved = await insertLancamentos(user.id, entries)
      onLancamentosAdded(saved)

      const atualizada: Simulado = {
        ...prova,
        status: 'concluida',
        redacaoTexto: textoRedacao,
        redacaoNota: correcao.nota,
        redacaoFeedback: correcao.feedback as unknown as Record<string, string>,
        notaFinal,
        finalizadoEm: agora,
      }
      try {
        await updateSimulado(prova.id, {
          status: 'concluida',
          redacaoTexto: textoRedacao,
          redacaoNota: correcao.nota,
          redacaoFeedback: correcao.feedback as unknown as Record<string, string>,
          notaFinal,
          finalizadoEm: agora,
        })
      } catch (err) {
        console.error('Erro ao concluir simulado:', err)
      }
      setProva(atualizada)
      setResultado(atualizada)
      setHistorico((prev) => [atualizada, ...prev])
      setEmAndamento(null)
      setFase('resultado')
      toast.success('Simulado concluído e registrado!')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(`Falha na correção: ${msg}`)
    } finally {
      setCorrigindo(false)
    }
  }

  // ---------- Render: geração ----------
  if (fase === 'gerando') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Loader2 size={28} className="animate-spin text-primary" />
        <div>
          <div className="font-display text-sm font-bold text-foreground">
            Montando sua prova…
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Gerando questões de {progresso.discName} ({progresso.feitas} de {SIMULADO_TOTAL}).
            <br />
            Isso leva alguns minutos — não feche esta tela.
          </p>
        </div>
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-card-raised">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(progresso.feitas / SIMULADO_TOTAL) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  // ---------- Render: prova ----------
  if (fase === 'prova' && prova) {
    const q = prova.questoes[idx]
    const respondidas = prova.questoes.filter(
      (_, i) => prova.respostas[String(i)] !== undefined
    ).length
    const disc = CURRICULUM[q?.disciplinaId]
    const topic = disc?.topics.find((t) => t.id === q?.topicoId)

    return (
      <div className="space-y-4">
        {/* Barra superior */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-soft bg-card-raised px-4 py-3">
          <span
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] font-bold ${
              segundosRestantes !== null && segundosRestantes < 600
                ? 'bg-primary/10 text-primary'
                : 'bg-background text-foreground'
            }`}
          >
            <Timer size={13} /> {formatTempo(segundosRestantes ?? 0)}
          </span>
          <span className="font-mono text-[11px] text-faint">
            Questão {idx + 1} de {prova.questoes.length} · {respondidas} respondida(s)
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setConfirmando(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-display text-[11px] font-bold text-primary-foreground transition hover:brightness-110 active:scale-95"
            >
              <Check size={12} /> Ir para a redação
            </button>
            <button
              onClick={() => {
                if (prova && window.confirm('Abandonar este simulado? O progresso será apagado.')) {
                  descartar(prova)
                  setProva(null)
                  setFase('setup')
                }
              }}
              className="rounded-md border border-border p-1.5 text-faint transition hover:border-primary/50 hover:text-primary"
              aria-label="Abandonar simulado"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Navegação numerada */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-border-soft bg-card-raised p-3">
          {prova.questoes.map((_, i) => {
            const atual = i === idx
            const marcada = prova.respostas[String(i)] !== undefined
            return (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-7 w-7 rounded-md font-mono text-[10px] font-bold transition ${
                  atual
                    ? 'bg-primary text-primary-foreground'
                    : marcada
                      ? 'bg-primary/15 text-primary'
                      : 'bg-background text-faint hover:text-foreground'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {/* Questão */}
        <div className="rounded-xl border border-border-soft bg-card-raised p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              {disc?.name ?? ''}
            </span>
            <span className="font-mono text-[10px] text-faint">{topic?.name ?? ''}</span>
          </div>
          <p className="mb-4 text-[14px] leading-relaxed text-foreground">{q?.enunciado}</p>
          <div className="space-y-2">
            {LETRAS.map((letra) => {
              const marcada = prova.respostas[String(idx)] === letra
              return (
                <button
                  key={letra}
                  onClick={() => responder(letra)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-[13px] leading-snug transition ${
                    marcada
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-[11px] font-bold ${
                      marcada ? 'bg-primary text-primary-foreground' : 'bg-card-raised text-faint'
                    }`}
                  >
                    {letra}
                  </span>
                  <span>{q?.alternativas[letra]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Anterior / próxima */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(prova.questoes.length - 1, i + 1))}
            disabled={idx === prova.questoes.length - 1}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-40"
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>

        {confirmando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-bold text-foreground">
                Finalizar a prova objetiva?
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                Você respondeu {respondidas} de {prova.questoes.length} questões. Questões sem
                resposta contam como erradas. Depois vem a redação (20 a 30 linhas).
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmando(false)}
                  className="rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Voltar
                </button>
                <button
                  onClick={finalizarObjetiva}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-display text-[12px] font-bold text-primary-foreground transition hover:brightness-110"
                >
                  <Check size={13} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------- Render: redação ----------
  if (fase === 'redacao' && prova) {
    const notaObj = prova.notaObjetiva ?? 0
    const acertosObj = prova.questoes.reduce(
      (s, q, i) => s + (prova.respostas[String(i)] === q.correta ? 1 : 0),
      0
    )
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-primary/30 bg-card-raised p-4">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            <Award size={12} className="text-primary" /> Prova objetiva encerrada
          </div>
          <p className="text-[13px] text-foreground">
            Acertos: <strong>{acertosObj}</strong> de {prova.questoes.length} — nota objetiva{' '}
            {notaObj.toFixed(1)}.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Agora a redação. A nota final do simulado é{' '}
            {Math.round(SIMULADO_PESO_OBJETIVA * 100)}% objetiva +{' '}
            {Math.round(SIMULADO_PESO_REDACAO * 100)}% redação.
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-card-raised p-4">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            <Sparkles size={12} className="text-primary" /> Tema da redação
          </div>
          {temaLoading && !prova.redacaoTema ? (
            <p className="flex items-center gap-2 py-4 text-[11px] text-faint">
              <Loader2 size={12} className="animate-spin" /> Gerando tema…
            </p>
          ) : prova.redacaoTema ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
              {prova.redacaoTema.replace(/\*\*/g, '')}
            </p>
          ) : (
            <p className="py-4 text-center text-[11px] text-faint">Tema indisponível.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            Sua redação (20 a 30 linhas)
          </label>
          <textarea
            value={textoRedacao}
            onChange={(e) => setTextoRedacao(e.target.value)}
            rows={16}
            placeholder="Escreva sua redação completa: introdução com tese, desenvolvimento argumentativo e conclusão com proposta de intervenção."
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-faint outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span
              className={`font-mono text-[10px] ${
                linhasRedacao >= 20 && linhasRedacao <= 30 ? 'text-primary' : 'text-faint'
              }`}
            >
              {linhasRedacao} linha(s) — alvo: 20 a 30
            </span>
            <button
              onClick={enviarRedacao}
              disabled={corrigindo || !prova.redacaoTema}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-display text-xs font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {corrigindo ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Enviar para correção
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Render: resultado ----------
  if (fase === 'resultado' && resultado) {
    const porDisc = resultadoPorDisciplina(resultado.questoes, resultado.respostas)
    const inicioMs = new Date(resultado.iniciadoEm).getTime()
    const fimMs = resultado.finalizadoEm
      ? new Date(resultado.finalizadoEm).getTime()
      : Date.now()
    const usado = formatTempo(Math.min(SIMULADO_LIMIT_MIN * 60, (fimMs - inicioMs) / 1000))

    return (
      <div className="space-y-5">
        <button
          onClick={() => {
            setResultado(null)
            setFase('setup')
          }}
          className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Voltar
        </button>

        {/* Nota final */}
        <div className="rounded-xl border border-primary/30 bg-card-raised p-5 text-center">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            Nota final do simulado
          </div>
          <div
            className="mt-2 font-display text-5xl font-bold"
            style={{ color: notaColor(resultado.notaFinal ?? 0) }}
          >
            {(resultado.notaFinal ?? 0).toFixed(1)}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Objetiva {Math.round(SIMULADO_PESO_OBJETIVA * 100)}%:{' '}
            <strong className="text-foreground">
              {(resultado.notaObjetiva ?? 0).toFixed(1)}
            </strong>{' '}
            · Redação {Math.round(SIMULADO_PESO_REDACAO * 100)}%:{' '}
            <strong className="text-foreground">
              {resultado.redacaoNota === null ? '—' : resultado.redacaoNota.toFixed(1)}
            </strong>
          </p>
          <p className="mt-1 font-mono text-[10px] text-faint">Tempo usado: {usado}</p>
        </div>

        {/* Por disciplina */}
        <div className="rounded-xl border border-border-soft bg-card-raised p-4">
          <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            Desempenho por matéria
          </div>
          <div className="space-y-1.5">
            {porDisc.map((d) => (
              <div
                key={d.discId}
                className="flex items-center gap-3 rounded-md bg-background px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] text-foreground">
                  {d.discName}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {d.acertos}/{d.total}
                </span>
                <span
                  className="w-10 text-right font-mono text-[11px] font-bold"
                  style={{ color: notaColor(d.pct / 10) }}
                >
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Redação */}
        {resultado.redacaoFeedback && (
          <div className="rounded-xl border border-border-soft bg-card-raised p-4">
            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
              Correção da redação
            </div>
            <div className="space-y-2">
              {CRITERIOS.map(({ key, label }) => {
                const v = resultado.redacaoFeedback?.[key]
                if (!v) return null
                return (
                  <div key={key} className="rounded-md border border-border-soft bg-background p-3">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                      {label}
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{v}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gabarito comentado */}
        <div className="rounded-xl border border-border-soft bg-card-raised p-4">
          <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            Gabarito comentado
          </div>
          <div className="space-y-3">
            {resultado.questoes.map((q, i) => {
              const sua = resultado.respostas[String(i)]
              const certa = sua === q.correta
              return (
                <details key={i} className="rounded-md border border-border-soft bg-background p-3">
                  <summary className="flex cursor-pointer items-center gap-2 text-[12px] text-foreground">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold ${
                        certa
                          ? 'bg-primary/15 text-primary'
                          : sua
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-card-raised text-faint'
                      }`}
                    >
                      {certa ? <Check size={11} /> : sua ? <X size={11} /> : '—'}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{q.enunciado}</span>
                    <span className="shrink-0 font-mono text-[10px] text-faint">
                      {sua ?? '—'} → {q.correta}
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1.5 border-t border-border-soft pt-2">
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{q.enunciado}</p>
                    <div className="space-y-1">
                      {LETRAS.map((l) => (
                        <p
                          key={l}
                          className={`text-[11px] leading-snug ${
                            l === q.correta
                              ? 'font-semibold text-primary'
                              : l === sua
                                ? 'text-destructive'
                                : 'text-faint'
                          }`}
                        >
                          <strong>{l})</strong> {q.alternativas[l]}
                        </p>
                      ))}
                    </div>
                    {q.explicacao && (
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {q.explicacao}
                      </p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---------- Render: setup ----------
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Formato */}
      <div className="rounded-xl border border-primary/30 bg-card-raised p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
            <FileText size={15} className="text-primary" />
          </span>
          <div>
            <div className="font-display text-sm font-bold text-foreground">
              Simulado padrão prova
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              60 questões + redação · até 5 horas
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {SIMULADO_DISTRIBUTION.map(({ discId, count }) => (
            <div
              key={discId}
              className="flex items-center justify-between rounded-md bg-background px-2.5 py-1.5"
            >
              <span className="truncate text-[11px] text-muted-foreground">
                {CURRICULUM[discId]?.name}
              </span>
              <span className="ml-2 shrink-0 font-mono text-[11px] font-bold text-primary">
                {count}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Questões inéditas de treino geradas por IA no estilo AOCP, priorizando o que você tem de
          pior. Ao final, 1 redação dissertativa-argumentativa (20 a 30 linhas). Nota final = 75%
          objetiva + 25% redação. O resultado é lançado automaticamente no seu desempenho.
        </p>
        {gerandoErro && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
            {gerandoErro}
          </p>
        )}
        <button
          onClick={iniciar}
          disabled={carregando}
          className="mt-4 flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-display text-xs font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 disabled:opacity-60"
        >
          <Play size={13} /> Iniciar simulado
        </button>
      </div>

      {/* Em andamento */}
      {emAndamento && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <Timer size={16} className="shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-foreground">Simulado em andamento</div>
            <p className="text-[11px] text-muted-foreground">
              Iniciado em{' '}
              {new Date(emAndamento.iniciadoEm).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
              .
            </p>
          </div>
          <button
            onClick={() => retomar(emAndamento)}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 font-display text-[11px] font-bold text-primary-foreground transition hover:brightness-110"
          >
            <RotateCcw size={12} /> Retomar
          </button>
          <button
            onClick={() => descartar(emAndamento)}
            className="shrink-0 rounded-md border border-border p-2 text-faint transition hover:border-destructive/50 hover:text-destructive"
            aria-label="Descartar simulado"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
            <History size={12} /> Histórico ({historico.length})
          </div>
          <ul className="space-y-1.5">
            {historico.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setResultado(s)
                    setFase('resultado')
                  }}
                  className="flex w-full items-center gap-3 rounded-md border border-border-soft bg-background px-3 py-2.5 text-left transition hover:border-primary/40"
                >
                  <span
                    className="w-10 shrink-0 font-mono text-sm font-bold"
                    style={{ color: notaColor(s.notaFinal ?? 0) }}
                  >
                    {(s.notaFinal ?? 0).toFixed(1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                    {s.questoes.length} questões ·{' '}
                    {new Date(s.iniciadoEm).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">ver resultado</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
