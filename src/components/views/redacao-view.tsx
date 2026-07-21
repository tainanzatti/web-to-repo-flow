import { useEffect, useState, useCallback } from "react";
import { PenTool, Loader2, Sparkles, Send, Check, AlertCircle } from "lucide-react";
import { fetchRedacoes, createRedacao, updateRedacaoNota, type Redacao } from "../../lib/db";
import { aiCorrigirRedacao, aiGerarTemaRedacao, type CorrecaoRedacao } from "../../lib/ai.service";

export function RedacaoView() {
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tema, setTema] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState<CorrecaoRedacao | null>(null);
  const [gerandoTema, setGerandoTema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRedacoes(await fetchRedacoes()); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGerarTema = async () => {
    setGerandoTema(true);
    setError(null);
    try { setTema(await aiGerarTemaRedacao()); } catch (err) { setError((err as Error).message); }
    setGerandoTema(false);
  };

  const handleCorrigir = async () => {
    if (!tema || !conteudo) return;
    setCorrigindo(true);
    setError(null);
    try {
      const r = await createRedacao(tema, conteudo);
      const c = await aiCorrigirRedacao(tema, conteudo);
      setCorrecao(c);
      if (r) await updateRedacaoNota(r.id, c.nota, JSON.stringify(c));
      load();
    } catch (err) { setError((err as Error).message); }
    setCorrigindo(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><PenTool className="w-7 h-7 text-brand-600" />Redação</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Treine redações com correção por IA.</p></div>

      {error && <div className="card p-4 text-sm text-error-600 dark:text-error-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1"><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tema</label><input type="text" value={tema} onChange={(e) => setTema(e.target.value)} className="input-base" placeholder="Digite ou gere um tema..." /></div>
          <button onClick={handleGerarTema} disabled={gerandoTema} className="btn-secondary ml-3 mt-6 flex items-center gap-2 shrink-0">{gerandoTema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Gerar tema</button>
        </div>
        <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Sua redação</label><textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} className="input-base resize-none" rows={12} placeholder="Escreva sua redação aqui..." /></div>
        <button onClick={handleCorrigir} disabled={corrigindo || !tema || !conteudo} className="btn-primary flex items-center gap-2">{corrigindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Corrigir com IA</button>
      </div>

      {correcao && (
        <div className="card p-6 animate-slideUp space-y-4">
          <div className="flex items-center gap-3"><Check className="w-6 h-6 text-success-500" /><h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">Correção</h3><span className="ml-auto text-2xl font-bold text-brand-600">{correcao.nota.toFixed(1)}/10</span></div>
          {correcao.criterios?.map((c, i) => (
            <div key={i} className="p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50">
              <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-ink-800 dark:text-ink-200">{c.nome}</span><span className="text-sm font-bold text-brand-600">{c.nota.toFixed(1)}</span></div>
              <p className="text-xs text-ink-500 dark:text-ink-400">{c.comentario}</p>
            </div>
          ))}
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20"><p className="text-sm text-ink-700 dark:text-ink-300">{correcao.feedback}</p></div>
        </div>
      )}

      {redacoes.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4">Redações Anteriores</h3>
          <div className="space-y-2">
            {redacoes.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{r.tema}</p><p className="text-xs text-ink-400">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</p></div>
                {r.nota != null && <span className="text-sm font-bold text-brand-600">{r.nota.toFixed(1)}/10</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
