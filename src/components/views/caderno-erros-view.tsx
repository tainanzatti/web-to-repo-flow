import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, RotateCcw, Trash2, X } from 'lucide-react'
import { CURRICULUM, type Lancamento } from '@/lib/curriculum'
import {
  deleteCadernoErro,
  fetchCadernoErros,
  setCadernoErroResolvida,
  type CadernoErro,
} from '@/lib/db'
import { useAuth } from '@/lib/auth-context'
import { SectionLabel } from '@/components/ui-bits'

type Props = { onAdd: (l: Omit<Lancamento, 'id'>) => Promise<void> }
type Filtro = 'pendentes' | 'resolvidas' | 'todas'

/** Trechos [[assim]] aparecem sublinhados. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[\[[^\]]+\]\])/g).map((p, i) =>
        p.startsWith('[[') ? (
          <u key={i} className="decoration-primary decoration-2 underline-offset-2">{p.slice(2, -2)}</u>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

export function CadernoErrosView({ onAdd }: Props) {
  const { user } = useAuth()
  const [itens, setItens] = useState<CadernoErro[] | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('pendentes')
  const [disc, setDisc] = useState<string>('todas')
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const [escolha, setEscolha] = useState<string | null>(null)
  const [revelado, setRevelado] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchCadernoErros(user.id).then(setItens).catch((e) => { console.error(e); setItens([]) })
  }, [user])

  const lista = useMemo(
    () =>
      (itens ?? []).filter(
        (e) =>
          (filtro === 'todas' || (filtro === 'resolvidas' ? e.resolvida : !e.resolvida)) &&
          (disc === 'todas' || e.disciplinaId === disc),
      ),
    [itens, filtro, disc],
  )
  const discs = useMemo(() => [...new Set((itens ?? []).map((e) => e.disciplinaId))], [itens])
  const pendentes = (itens ?? []).filter((e) => !e.resolvida).length

  const abrir = (id: string) => { setAbertoId(abertoId === id ? null : id); setEscolha(null); setRevelado(false) }

  const atualizar = (id: string, resolvida: boolean) => {
    setItens((prev) => prev?.map((e) => (e.id === id ? { ...e, resolvida } : e)) ?? null)
    setCadernoErroResolvida(id, resolvida).catch(console.error)
  }

  const conferir = async (e: CadernoErro) => {
    if (!escolha) return
    setRevelado(true)
    const acertou = escolha === e.questao.correta
    if (acertou) atualizar(e.id, true)
    await onAdd({
      disciplinaId: e.disciplinaId,
      topicoId: e.topicoId,
      quantidade: 1,
      acertos: acertou ? 1 : 0,
      minutos: 2,
      data: new Date().toISOString().slice(0, 10),
    })
  }

  const remover = (id: string) => {
    setItens((prev) => prev?.filter((e) => e.id !== id) ?? null)
    deleteCadernoErro(id).catch(console.error)
  }

  if (!itens) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-faint" /></div>

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>CADERNO DE ERROS</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Toda questão errada nos simulados e flashcards vem para cá. Refaça: se acertar, ela sai da lista de pendentes.
        </p>
        <p className="mt-2 font-display text-lg font-bold text-foreground">{pendentes} pendentes</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(['pendentes', 'resolvidas', 'todas'] as Filtro[]).map((f) => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium capitalize transition ${filtro === f ? 'border-primary bg-primary/15 text-primary' : 'border-border-soft text-muted-foreground hover:text-foreground'}`}>
              {f}
            </button>
          ))}
          <select value={disc} onChange={(e) => setDisc(e.target.value)}
            className="rounded-lg border border-border-soft bg-secondary px-3 py-1.5 text-[12px] text-foreground">
            <option value="todas">Todas as matérias</option>
            {discs.map((d) => <option key={d} value={d}>{CURRICULUM[d]?.name ?? d}</option>)}
          </select>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">
          {itens.length === 0 ? 'Nenhum erro registrado ainda. Faça um simulado ou flashcards.' : 'Nada por aqui com esse filtro.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((e) => {
            const d = CURRICULUM[e.disciplinaId]
            const topico = d?.topics.find((t) => t.id === e.topicoId)?.name ?? e.topicoId
            const aberto = abertoId === e.id
            const q = e.questao
            const letras = Object.keys(q.alternativas).filter((l) => q.alternativas[l]).sort()
            return (
              <div key={e.id} className="rounded-2xl border border-border-soft bg-card p-4">
                <button onClick={() => abrir(e.id)} className="flex w-full items-start gap-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-faint">
                      {d?.name ?? e.disciplinaId} · {topico} · {e.origem === 'simulado' ? 'Simulado' : 'Flashcard'} · {new Date(e.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`mt-1 block text-[13px] text-foreground ${aberto ? '' : 'line-clamp-2'}`}><Rich text={q.enunciado} /></span>
                  </span>
                  {e.resolvida && <span className="shrink-0 rounded-full bg-tier-high/15 px-2 py-0.5 text-[10px] font-bold text-tier-high">Resolvida</span>}
                </button>

                {aberto && (
                  <div className="mt-4 space-y-3">
                    {q.texto && (
                      <div className="whitespace-pre-wrap rounded-lg border border-border-soft bg-secondary p-3 text-[13px] leading-relaxed text-muted-foreground"><Rich text={q.texto} /></div>
                    )}
                    <div className="space-y-2">
                      {letras.map((l) => {
                        const certa = revelado && l === q.correta
                        const errada = revelado && l === escolha && l !== q.correta
                        return (
                          <button key={l} disabled={revelado} onClick={() => setEscolha(l)}
                            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[13px] transition ${certa ? 'border-tier-high bg-tier-high/10' : errada ? 'border-destructive bg-destructive/10' : escolha === l ? 'border-primary bg-primary/10' : 'border-border-soft bg-secondary hover:border-primary/40'}`}>
                            <span className="font-mono font-bold text-primary">{l}</span>
                            <span className="text-foreground"><Rich text={q.alternativas[l]} /></span>
                          </button>
                        )
                      })}
                    </div>
                    {!revelado ? (
                      <button disabled={!escolha} onClick={() => conferir(e)}
                        className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-40">
                        Responder
                      </button>
                    ) : (
                      <div className={`rounded-lg border p-3 text-[13px] leading-relaxed ${escolha === q.correta ? 'border-tier-high/50 bg-tier-high/10' : 'border-destructive/50 bg-destructive/10'}`}>
                        <p className="mb-1 font-semibold text-foreground">
                          {escolha === q.correta ? `Certo! Resposta ${q.correta}. Marcada como resolvida.` : `Errou de novo — a correta é ${q.correta}.`}
                        </p>
                        <p className="text-muted-foreground"><Rich text={q.explicacao} /></p>
                        {q.comentarios && letras.map((l) => q.comentarios?.[l] ? (
                          <p key={l} className="mt-1 text-muted-foreground"><strong>{l}:</strong> <Rich text={q.comentarios[l]} /></p>
                        ) : null)}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1 text-[12px]">
                      <span className="text-faint">Sua resposta original: {e.resposta ?? '—'}</span>
                      <span className="flex-1" />
                      {revelado && <button onClick={() => { setEscolha(null); setRevelado(false) }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><RotateCcw size={12} /> Refazer</button>}
                      <button onClick={() => atualizar(e.id, !e.resolvida)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        {e.resolvida ? <><X size={12} /> Voltar p/ pendentes</> : <><Check size={12} /> Marcar resolvida</>}
                      </button>
                      <button onClick={() => remover(e.id)} className="flex items-center gap-1 text-destructive hover:brightness-125"><Trash2 size={12} /> Excluir</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
