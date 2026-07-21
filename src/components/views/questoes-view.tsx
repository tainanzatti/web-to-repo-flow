import { useEffect, useState, useCallback } from "react";
import { FileQuestion, Check, X, Loader2 } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchQuestoes, insertQuestao, type QuestaoRow } from "../../lib/db";
import type { Discipline, Topic } from "../../lib/curriculum";

export function QuestoesView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selDisc, setSelDisc] = useState("");
  const [selTopic, setSelTopic] = useState("");
  const [acertou, setAcertou] = useState(true);
  const [fonte, setFonte] = useState("AOCP");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [d, t, q] = await Promise.all([fetchDisciplines(), fetchAllTopics(), fetchQuestoes()]);
    setDisciplines(d); setTopics(t); setQuestoes(q); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTopics = selDisc ? topics.filter((t) => t.disciplina_id === selDisc) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDisc) return;
    setSubmitting(true);
    await insertQuestao(selDisc, selTopic || null, acertou, fonte);
    setSelTopic(""); setSubmitting(false); await load();
  };

  const byDiscipline = disciplines.map((d) => {
    const dQ = questoes.filter((q) => q.disciplina_id === d.id);
    const acertos = dQ.filter((q) => q.acertou).length;
    return { disc: d, total: dQ.length, acertos, taxa: dQ.length > 0 ? (acertos / dQ.length) * 100 : 0 };
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Questões</h1>
        <p className="text-sm text-ink-500 mt-1">Registre questões resolvidas e acompanhe seu desempenho por disciplina.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1 block">Disciplina</label>
            <select value={selDisc} onChange={(e) => { setSelDisc(e.target.value); setSelTopic(""); }} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500" required>
              <option value="">Selecione...</option>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1 block">Tópico (opcional)</label>
            <select value={selTopic} onChange={(e) => setSelTopic(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500" disabled={!selDisc}>
              <option value="">Geral</option>
              {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1 block">Resultado</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAcertou(true)} className={`btn ${acertou ? "btn-primary" : "btn-secondary"} flex-1`}><Check className="w-4 h-4" /> Acertei</button>
              <button type="button" onClick={() => setAcertou(false)} className={`btn ${!acertou ? "btn-danger" : "btn-secondary"} flex-1`}><X className="w-4 h-4" /> Errei</button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 mb-1 block">Banca</label>
            <input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={submitting || !selDisc} className="btn-primary w-full">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileQuestion className="w-4 h-4" />} Registrar</button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {byDiscipline.map(({ disc, total, acertos, taxa }) => (
          <div key={disc.id} className="card p-4">
            <p className="text-sm font-semibold text-ink-900 mb-2">{disc.nome}</p>
            <div className="flex items-center justify-between text-xs text-ink-500"><span>{acertos}/{total} acertos</span><span>{taxa.toFixed(0)}%</span></div>
            <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${taxa}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 mb-3">Histórico recente</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {questoes.slice(0, 20).map((q) => {
            const disc = disciplines.find((d) => d.id === q.disciplina_id);
            return (
              <div key={q.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-ink-50 last:border-0">
                {q.acertou ? <Check className="w-4 h-4 text-success-600" /> : <X className="w-4 h-4 text-error-600" />}
                <span className="flex-1 text-ink-700">{disc?.nome ?? "—"}</span>
                <span className="text-xs text-ink-400">{new Date(q.criado_em).toLocaleDateString("pt-BR")}</span>
              </div>
            );
          })}
          {questoes.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Nenhuma questão registrada ainda.</p>}
        </div>
      </div>
    </div>
  );
}
