import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Check, X, Trash2, Loader2 } from "lucide-react";
import { fetchDisciplines, fetchTopics, fetchQuestoes, insertQuestao, deleteQuestao, type QuestaoRow } from "../../lib/db";
import type { Discipline, Topic } from "../../lib/curriculum";

export default function QuestoesView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selDisciplina, setSelDisciplina] = useState("");
  const [selTopico, setSelTopico] = useState("");
  const [acertou, setAcertou] = useState<boolean | null>(null);
  const [fonte, setFonte] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [discs, tops, quests] = await Promise.all([fetchDisciplines(), fetchTopics(), fetchQuestoes()]);
      setDisciplines(discs); setTopics(tops); setQuestoes(quests);
      if (discs.length > 0 && !selDisciplina) setSelDisciplina(discs[0].id);
    } catch (err) { console.error("Erro ao carregar questões:", err); }
    finally { setLoading(false); }
  }, [selDisciplina]);

  useEffect(() => { load(); }, [load]);

  const filteredTopics = topics.filter((t) => t.disciplina_id === selDisciplina);

  const handleSave = async () => {
    if (acertou === null || !selDisciplina) return;
    setSaving(true);
    try {
      await insertQuestao({ disciplina_id: selDisciplina, topico_id: selTopico || null, acertou, fonte: fonte || null });
      setShowForm(false); setSelTopico(""); setAcertou(null); setFonte("");
      await load();
    } catch (err) { console.error("Erro ao salvar questão:", err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => { try { await deleteQuestao(id); await load(); } catch (err) { console.error("Erro ao deletar:", err); } };

  const discMap = new Map(disciplines.map((d) => [d.id, d.nome]));
  const topicMap = new Map(topics.map((t) => [t.id, t.nome]));
  const total = questoes.length;
  const acertosCount = questoes.filter((q) => q.acertou).length;
  const errosCount = total - acertosCount;
  const aproveitamento = total > 0 ? Math.round((acertosCount / total) * 100) : 0;

  const porDisciplina = disciplines.map((d) => {
    const dQuestoes = questoes.filter((q) => q.disciplina_id === d.id);
    const dAcertos = dQuestoes.filter((q) => q.acertou).length;
    return { disciplina: d, total: dQuestoes.length, acertos: dAcertos, erros: dQuestoes.length - dAcertos, aproveitamento: dQuestoes.length > 0 ? Math.round((dAcertos / dQuestoes.length) * 100) : 0 };
  });

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-ink-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-brand-600" /> Questões</h1>
          <p className="text-sm text-ink-500 mt-1">Registre questões de simulados, provas anteriores e exercícios para acompanhar seu desempenho.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus className="w-4 h-4" /> Nova questão</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center"><p className="text-3xl font-bold text-ink-900">{total}</p><p className="text-xs text-ink-500 mt-1">Total</p></div>
        <div className="card p-4 text-center"><p className="text-3xl font-bold text-success-600">{acertosCount}</p><p className="text-xs text-ink-500 mt-1">Acertos ({aproveitamento}%)</p></div>
        <div className="card p-4 text-center"><p className="text-3xl font-bold text-error-500">{errosCount}</p><p className="text-xs text-ink-500 mt-1">Erros</p></div>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 animate-fadeIn">
          <h3 className="font-semibold text-ink-900 mb-4">Registrar Questão</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink-700 block mb-1.5">Disciplina</label>
              <select value={selDisciplina} onChange={(e) => { setSelDisciplina(e.target.value); setSelTopico(""); }} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 block mb-1.5">Tópico (opcional)</label>
              <select value={selTopico} onChange={(e) => setSelTopico(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Sem tópico específico —</option>
                {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 block mb-1.5">Resultado</label>
              <div className="flex gap-3">
                <button onClick={() => setAcertou(true)} className={`btn flex-1 ${acertou === true ? "bg-success-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}><Check className="w-4 h-4" /> Acertei</button>
                <button onClick={() => setAcertou(false)} className={`btn flex-1 ${acertou === false ? "bg-error-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}><X className="w-4 h-4" /> Errei</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700 block mb-1.5">Fonte (opcional)</label>
              <input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Simulado AOCP, Prova 2023..." className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={acertou === null || saving} className="btn-primary flex-1">{saving ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-ink-700 mb-3">Desempenho por Disciplina</h3>
        <div className="space-y-2">
          {porDisciplina.map((d) => (
            <div key={d.disciplina.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
              <span className="text-sm text-ink-700 flex-1 truncate">{d.disciplina.nome}</span>
              {d.total > 0 ? (<>
                <div className="flex gap-1.5 text-xs"><span className="text-success-600 font-semibold">{d.acertos}✓</span><span className="text-error-500 font-semibold">{d.erros}✗</span></div>
                <div className="w-20 h-1.5 bg-ink-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${d.aproveitamento}%` }} /></div>
                <span className="text-xs font-semibold text-ink-600 w-8 text-right">{d.aproveitamento}%</span>
              </>) : <span className="text-xs text-ink-300">—</span>}
            </div>
          ))}
        </div>
      </div>

      {questoes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-700 mb-3">Histórico Recente</h3>
          <div className="space-y-2">
            {questoes.slice(0, 20).map((q) => (
              <div key={q.id} className="card p-3 flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.acertou ? "bg-success-100 text-success-600" : "bg-error-100 text-error-500"}`}>{q.acertou ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800">{discMap.get(q.disciplina_id) ?? q.disciplina_id}{q.topico_id && ` — ${topicMap.get(q.topico_id) ?? q.topico_id}`}</p>
                  <p className="text-xs text-ink-400">{new Date(q.criado_em).toLocaleDateString("pt-BR")}{q.fonte && ` · ${q.fonte}`}</p>
                </div>
                <button onClick={() => handleDelete(q.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-300 hover:text-error-500 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
