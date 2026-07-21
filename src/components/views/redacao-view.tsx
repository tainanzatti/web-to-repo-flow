import { useEffect, useState, useCallback } from "react";
import { PenTool, Loader2, FileText, Award, Sparkles, AlertCircle, CheckCircle, X } from "lucide-react";
import { fetchRedacoes, insertRedacao, updateRedacaoNota, fetchQuestaoLancamentos, fetchLancamentos, fetchResumo, type RedacaoRow } from "../../lib/db";
import { aiGerarTemaRedacao, aiCorrigirRedacao, type CorrecaoRedacao } from "../../lib/ai.service";

export function RedacaoView() {
  const [redacoes, setRedacoes] = useState<RedacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gerandoTema, setGerandoTema] = useState(false);
  const [temaErro, setTemaErro] = useState<string | null>(null);
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState<CorrecaoRedacao | null>(null);
  const [correcaoErro, setCorrecaoErro] = useState<string | null>(null);

  const load = useCallback(async () => { const data = await fetchRedacoes(); setRedacoes(data); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const handleGerarTema = async () => {
    if (gerandoTema) return; setGerandoTema(true); setTemaErro(null);
    try {
      const [questaoLancs, lancs] = await Promise.all([fetchQuestaoLancamentos(), fetchLancamentos()]);
      const topicoIds = new Set<string>();
      for (const l of lancs) { if (l.topico_id) topicoIds.add(l.topico_id); }
      for (const l of questaoLancs) { if (l.topico_id) topicoIds.add(l.topico_id); }
      const resumos: string[] = [];
      for (const tid of topicoIds) { try { const r = await fetchResumo(tid); if (r) resumos.push(r); } catch {} }
      const conteudo = resumos.length > 0 ? "Resumos estudados:\n" + resumos.slice(0, 5).join("\n---\n") : "Gere um tema geral sobre ordem pública, segurança pública, cidadania, ou políticas públicas de segurança no contexto da Polícia Militar de Santa Catarina.";
      const { tema: generatedTema, error } = await aiGerarTemaRedacao(conteudo);
      if (error || !generatedTema) { setTemaErro(error ?? "Erro ao gerar tema"); setGerandoTema(false); return; }
      setTema(generatedTema); setGerandoTema(false);
    } catch (err) { setTemaErro((err as Error).message); setGerandoTema(false); }
  };

  const handleSubmit = async () => {
    if (!tema || !texto.trim()) return; setSubmitting(true); setErro(null);
    try { await insertRedacao(tema, texto); setTexto(""); setTema(""); setSuccess(true); setTimeout(() => setSuccess(false), 3000); await load(); }
    catch (err) { setErro((err as Error).message); }
    setSubmitting(false);
  };

  const handleCorrigir = async () => {
    if (!tema || !texto.trim() || texto.trim().length < 50) return;
    setCorrigindo(true); setCorrecaoErro(null); setCorrecao(null);
    const { correcao: corr, error } = await aiCorrigirRedacao(tema, texto);
    if (error || !corr) { setCorrecaoErro(error ?? "Erro ao corrigir"); setCorrigindo(false); return; }
    setCorrecao(corr); setCorrigindo(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Redação</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Pratique suas redações, gere temas com IA e receba correção automática.</p></div>
      <div className="card p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300">Tema</label>
            <button onClick={handleGerarTema} disabled={gerandoTema} className="btn-primary text-xs py-1.5 px-3">{gerandoTema ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar tema com IA</>}</button>
          </div>
          <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Clique em 'Gerar tema com IA' ou digite manualmente..." className="input-base border-ink-200 dark:border-ink-700" />
          {temaErro && <p className="text-xs text-error-600 dark:text-error-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {temaErro}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Sua redação</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua redação aqui..." rows={12} className="input-base border-ink-200 dark:border-ink-700 resize-y" />
          <p className="text-xs text-ink-400 mt-1">{texto.length} caracteres</p>
        </div>
        {erro && <div className="rounded-xl bg-error-50 dark:bg-error-900/30 px-4 py-3 text-sm text-error-700 dark:text-error-300">{erro}</div>}
        {success && <div className="rounded-xl bg-success-50 dark:bg-success-900/30 px-4 py-3 text-sm text-success-700 dark:text-success-300 animate-fadeIn flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Redação salva com sucesso!</div>}
        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={submitting || !tema || !texto.trim()} className="btn-primary">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />} Salvar redação</button>
          <button onClick={handleCorrigir} disabled={corrigindo || !tema || texto.trim().length < 50} className="btn-secondary">{corrigindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Corrigir com IA</button>
        </div>
      </div>
      {correcao && (
        <div className="card p-6 animate-slideUp">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><Award className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Correção da IA</h3>
            <button onClick={() => setCorrecao(null)} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">{correcao.nota.toFixed(0)}</div>
            <div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Nota final</p><p className="text-xs text-ink-500 dark:text-ink-400">Média dos critérios avaliados</p></div>
          </div>
          <p className="text-sm text-ink-700 dark:text-ink-300 mb-4">{correcao.feedback}</p>
          <div className="space-y-2">
            {correcao.criterios.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-800">
                <div className="flex-1"><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{c.nome}</p><p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{c.comentario}</p></div>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{c.nota.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {correcaoErro && <p className="text-xs text-error-600 dark:text-error-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {correcaoErro}</p>}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Redações anteriores</h3>
        <div className="space-y-2">
          {redacoes.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-ink-50 dark:border-ink-800 last:border-0">
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{r.tema}</p><p className="text-xs text-ink-400">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</p></div>
              {r.nota !== null && <span className="text-sm font-bold text-success-600 dark:text-success-400 flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {Number(r.nota).toFixed(0)}</span>}
            </div>
          ))}
          {redacoes.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Nenhuma redação registrada.</p>}
        </div>
      </div>
    </div>
  );
}
