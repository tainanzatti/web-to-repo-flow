import { useEffect, useState, useCallback } from "react";
import { PenTool, Loader2, FileText, Award } from "lucide-react";
import { fetchRedacoes, insertRedacao, type RedacaoRow } from "../../lib/db";

export function RedacaoView() {
  const [redacoes, setRedacoes] = useState<RedacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchRedacoes();
    setRedacoes(data); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!tema || !texto.trim()) return;
    setSubmitting(true); setErro(null);
    try { await insertRedacao(tema, texto); setTexto(""); setTema(""); await load(); }
    catch (err) { setErro((err as Error).message); }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Redação</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Pratique suas redações e acompanhe seu histórico.</p>
      </div>
      <div className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tema</label>
          <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Digite o tema da redação..." className="input-base border-ink-200 dark:border-ink-700" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Sua redação</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua redação aqui..." rows={12} className="input-base border-ink-200 dark:border-ink-700 resize-y" />
          <p className="text-xs text-ink-400 mt-1">{texto.length} caracteres</p>
        </div>
        {erro && <div className="rounded-xl bg-error-50 dark:bg-error-900/30 px-4 py-3 text-sm text-error-700 dark:text-error-300">{erro}</div>}
        <button onClick={handleSubmit} disabled={submitting || !tema || !texto.trim()} className="btn-primary">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />} Salvar redação</button>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Redações anteriores</h3>
        <div className="space-y-2">
          {redacoes.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-ink-50 dark:border-ink-800 last:border-0">
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{r.tema}</p><p className="text-xs text-ink-400">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</p></div>
              {r.nota !== null && <span className="text-sm font-bold text-success-600 dark:text-success-400 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {Number(r.nota).toFixed(1)}</span>}
            </div>
          ))}
          {redacoes.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Nenhuma redação registrada.</p>}
        </div>
      </div>
    </div>
  );
}
