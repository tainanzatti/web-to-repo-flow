import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Send, Sparkles, History } from 'lucide-react'
import { generateAI, corrigirRedacaoAI } from '@/lib/ai-client'
import { fetchRedacoes, insertRedacao, type Redacao } from '@/lib/db'
import { useAuth } from '@/lib/auth-context'
import { TypewriterMarkdown } from '@/components/ui-bits'

import { CRITERIOS_REDACAO as CRITERIOS } from '@/lib/redacao-criterios'

function notaColor(nota: number): string {
  if (nota < 5) return 'var(--tier-weak)'
  if (nota < 7.5) return 'var(--tier-mid)'
  if (nota < 9) return 'var(--tier-good)'
  return 'var(--tier-mastered)'
}

export function RedacaoPanel({ onNota }: { onNota?: (nota: number) => void }) {
  const { user } = useAuth()
  const [tema, setTema] = useState<string | null>(null)
  const [temaLoading, setTemaLoading] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ultima, setUltima] = useState<Redacao | null>(null)
  const [historico, setHistorico] = useState<Redacao[]>([])

  useEffect(() => {
    if (!user) return
    fetchRedacoes(user.id)
      .then(setHistorico)
      .catch((err) => {
        console.error('Erro ao carregar histórico de redações:', err)
        toast.error('Não foi possível carregar seu histórico de redações.')
      })
  }, [user])

  async function gerarTema() {
    setTemaLoading(true)
    setErro(null)
    setUltima(null)
    try {
      const text = await generateAI({ kind: 'redacao-tema' })
      setTema(text)
      setTexto('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setTemaLoading(false)
    }
  }

  async function enviar() {
    if (!tema || texto.trim().length < 200) {
      setErro('Escreva pelo menos alguns parágrafos (mínimo ~200 caracteres) antes de enviar.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const res = await corrigirRedacaoAI(tema, texto)
      if (user) {
        const saved = await insertRedacao(user.id, {
          tema,
          texto,
          nota: res.nota,
          feedback: res.feedback as unknown as Record<string, string>,
          comentario: res.comentario ?? null,
        })
        setUltima(saved)
        setHistorico((p) => [saved, ...p])
      } else {
        setUltima({
          id: 'local',
          tema,
          texto,
          nota: res.nota,
          feedback: res.feedback as unknown as Record<string, string>,
          comentario: res.comentario ?? null,
          criadoEm: new Date().toISOString(),
        })
      }
      onNota?.(res.nota)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setEnviando(false)
    }
  }

  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-5">
      {/* Tema */}
      <div className="rounded-xl border border-primary/30 bg-card-raised p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-faint uppercase">
            <Sparkles size={12} className="text-primary" /> Tema da redação
          </span>
          <button
            onClick={gerarTema}
            disabled={temaLoading}
            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-60"
          >
            {temaLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            {tema ? 'Gerar novo tema' : 'Gerar tema'}
          </button>
        </div>
        {temaLoading && !tema ? (
          <p className="py-6 text-center text-[11px] text-faint">Gerando tema…</p>
        ) : tema ? (
          <TypewriterMarkdown text={tema} animate={false} />
        ) : (
          <p className="py-6 text-center text-[11px] text-faint">
            Gere um tema dissertativo-argumentativo baseado nos assuntos do edital do PMSC.
          </p>
        )}
      </div>

      {/* Escrita */}
      {tema && (
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-semibold tracking-[0.15em] text-faint uppercase">
            Sua redação
          </label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={12}
            placeholder="Escreva aqui sua redação completa: introdução com tese, desenvolvimento argumentativo e conclusão com proposta de intervenção."
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-faint outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] text-faint">{palavras} palavras</span>
            <button
              onClick={enviar}
              disabled={enviando}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-display text-xs font-bold text-primary-foreground transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {enviando ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Enviar para correção
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-[11px] text-primary">
          {erro}
        </p>
      )}

      {/* Resultado */}
      {ultima && ultima.nota !== null && (
        <div className="rounded-xl border border-border-soft bg-card-raised p-4">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 font-display text-xl font-bold"
              style={{ borderColor: notaColor(ultima.nota), color: notaColor(ultima.nota) }}
            >
              {ultima.nota.toFixed(1)}
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold text-foreground">Nota final</div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {ultima.comentario || 'Correção concluída. Veja os critérios abaixo.'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {CRITERIOS.map(({ key, label }) => {
              const v = ultima.feedback?.[key]
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
          <p className="mt-3 text-[10px] text-faint">
            Esta nota alimenta o domínio da disciplina Redação (nota × 10).
          </p>
        </div>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-faint uppercase">
            <History size={12} /> Evolução ({historico.length})
          </div>
          <ul className="space-y-1.5">
            {historico.slice(0, 8).map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md border border-border-soft bg-background px-3 py-2"
              >
                <span
                  className="w-9 shrink-0 font-mono text-sm font-bold"
                  style={{ color: r.nota === null ? 'var(--tier-none)' : notaColor(r.nota) }}
                >
                  {r.nota === null ? '—' : r.nota.toFixed(1)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  {r.tema.replace(/[*#]/g, '').replace(/^\s*Tema:\s*/i, '').slice(0, 90)}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-faint">
                  {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
