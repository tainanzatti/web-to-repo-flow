import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, HelpCircle, CheckCircle, XCircle, BookOpen, Sparkles, AlertCircle, Award } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchQuestoes, insertQuestao, deleteQuestao, fetchQuestaoLancamentos, insertQuestaoLancamento, deleteQuestaoLancamento, type QuestaoLancamentoRow } from "../../lib/db";
import { type Discipline, type Topic, type QuestaoRow } from "../../lib/curriculum";
import { aiGerarQuestoes, aiExplicarAlternativa, type QuestaoGerada } from "../../lib/ai.service";

export function QuestoesView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [lancamentos, setLancamentos] = useState<QuestaoLancamentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selDisc, setSelDisc] = useState("");
  const [selTopico, setSelTopico] = useState("");
  const [acertou, setAcertou] = useState(true);
  const [fonte, setFonte] = useState("");
  const [saving, setSaving] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchDisc, setBatchDisc] = useState("");
  const [batchTopico, setBatchTopico] = useState("");
  const [batchQuantidade, setBatchQuantidade] = useState(10);
  const [batchAcertos, setBatchAcertos] = useState(0);
  const [batchFonte, setBatchFonte] = useState("");
  const [batchSaving, setBatchSaving] = useState(false);
  const [showGerar, setShowGerar] = useState(false);
  const [gerarDisc, setGerarDisc] = useState("");
  const [gerarTopico, setGerarTopico] = useState("");
  const [gerarQtd, setGerarQtd] = useState(5);
  const [gerando, setGerando] = useState(false);
  const [questoesGeradas, setQuestoesGeradas] = useState<QuestaoGerada[]>([]);
  const [gerarErro, setGerarErro] = useState<string | null>(null);
  const [explicando, setExplicando] = useState<number | null>(null);
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [explicacaoErro, setExplicacaoErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [d, t, q, l] = await Promise.all([fetchDisciplines(), fetchAllTopics(), fetchQuestoes(), fetchQuestaoLancamentos()]);
    setDisciplines(d); setTopics(t); setQuestoes(q); setLancamentos(l); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filteredTopics = topics.filter((t) => t.disciplina_id === selDisc);
  const batchTopics = topics.filter((t) => t.disciplina_id === batchDisc);
  const gerarTopics = topics.filter((t) => t.disciplina_id === gerarDisc);

  const handleSave = async () => {
    if (!selDisc || !selTopico) return; setSaving(true);
    await insertQuestao(selDisc, selTopico, acertou, fonte.trim() || null);
    setSelTopico(""); setFonte(""); setAcertou(true); setShowForm(false); setSaving(false); await load();
  };
  const handleBatchSave = async () => {
    if (!batchDisc || !batchTopico || batchQuantidade < 1) return; setBatchSaving(true);
    await insertQuestaoLancamento(batchDisc, batchTopico, batchQuantidade, Math.min(batchAcertos, batchQuantidade), batchFonte.trim() || null);
    setBatchDisc(""); setBatchTopico(""); setBatchQuantidade(10); setBatchAcertos(0); setBatchFonte(""); setShowBatchForm(false); setBatchSaving(false); await load();
  };
  const handleDelete = async (id: string) => { await deleteQuestao(id); await load(); };
  const handleDeleteLanc = async (id: string) => { await deleteQuestaoLancamento(id); await load(); };

  const handleGerar = async () => {
    if (!gerarDisc || !gerarTopico) return; setGerando(true); setGerarErro(null); setQuestoesGeradas([]);
    const disc = disciplines.find((d) => d.id === gerarDisc)?.nome ?? "";
    const top = topics.find((t) => t.id === gerarTopico)?.nome ?? "";
    const { questoes: qs, error } = await aiGerarQuestoes(disc, top, gerarQtd);
    if (error) { setGerarErro(error); setGerando(false); return; }
    setQuestoesGeradas(qs); setGerando(false);
  };

  const handleExplicar = async (q: QuestaoGerada, idx: number) => {
    setExplicando(idx); setExplicacao(null); setExplicacaoErro(null);
    const disc = disciplines.find((d) => d.id === gerarDisc)?.nome ?? "";
    const { content, error } = await aiExplicarAlternativa(q.enunciado, q.correta, q.alternativas, disc);
    if (error) { setExplicacaoErro(error); } else { setExplicacao(content); }
    setExplicando(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Questões</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Registre questões, gere questões com IA no estilo AOCP e obtenha explicações.</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setShowForm(!showForm); setShowBatchForm(false); setShowGerar(false); }} className="btn-primary"><Plus className="w-4 h-4" /> Questão individual</button>
        <button onClick={() => { setShowBatchForm(!showBatchForm); setShowForm(false); setShowGerar(false); }} className="btn-secondary"><BookOpen className="w-4 h-4" /> Lançamento em lote</button>
        <button onClick={() => { setShowGerar(!showGerar); setShowForm(false); setShowBatchForm(false); }} className="btn-secondary"><Sparkles className="w-4 h-4" /> Gerar com IA</button>
      </div>
      {showForm && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Registrar questão individual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina</label><select value={selDisc} onChange={(e) => { setSelDisc(e.target.value); setSelTopico(""); }} className="input-base border-ink-200 dark:border-ink-700"><option value="">Selecione...</option>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico</label><select value={selTopico} onChange={(e) => setSelTopico(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" disabled={!selDisc}><option value="">Selecione...</option>{filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
          </div>
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Resultado</label><div className="flex gap-2"><button onClick={() => setAcertou(true)} className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${acertou ? "bg-success-600 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400"}`}><CheckCircle className="w-4 h-4 inline mr-1" /> Acertei</button><button onClick={() => setAcertou(false)} className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${!acertou ? "bg-error-600 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400"}`}><XCircle className="w-4 h-4 inline mr-1" /> Errei</button></div></div>
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Fonte (opcional)</label><input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Simulado AOCP, QConcursos..." className="input-base border-ink-200 dark:border-ink-700" /></div>
          <div className="flex gap-2 justify-end"><button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button><button onClick={handleSave} disabled={saving || !selDisc || !selTopico} className="btn-primary">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Salvar</button></div>
        </div>
      )}
      {showBatchForm && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Lançamento em lote</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina</label><select value={batchDisc} onChange={(e) => { setBatchDisc(e.target.value); setBatchTopico(""); }} className="input-base border-ink-200 dark:border-ink-700"><option value="">Selecione...</option>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico</label><select value={batchTopico} onChange={(e) => setBatchTopico(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" disabled={!batchDisc}><option value="">Selecione...</option>{batchTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Quantidade</label><input type="number" min={1} value={batchQuantidade} onChange={(e) => setBatchQuantidade(Math.max(1, parseInt(e.target.value) || 1))} className="input-base border-ink-200 dark:border-ink-700" /></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Acertos</label><input type="number" min={0} max={batchQuantidade} value={batchAcertos} onChange={(e) => setBatchAcertos(Math.min(batchQuantidade, Math.max(0, parseInt(e.target.value) || 0)))} className="input-base border-ink-200 dark:border-ink-700" /></div>
          </div>
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Fonte (opcional)</label><input type="text" value={batchFonte} onChange={(e) => setBatchFonte(e.target.value)} placeholder="Ex: Simulado AOCP..." className="input-base border-ink-200 dark:border-ink-700" /></div>
          <div className="flex gap-2 justify-end"><button onClick={() => setShowBatchForm(false)} className="btn-secondary">Cancelar</button><button onClick={handleBatchSave} disabled={batchSaving || !batchDisc || !batchTopico} className="btn-primary">{batchSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Salvar lote</button></div>
        </div>
      )}
      {showGerar && (
        <div className="card p-6 space-y-4 animate-slideUp">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Gerar questões com IA (estilo AOCP)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina</label><select value={gerarDisc} onChange={(e) => { setGerarDisc(e.target.value); setGerarTopico(""); }} className="input-base border-ink-200 dark:border-ink-700"><option value="">Selecione...</option>{disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico</label><select value={gerarTopico} onChange={(e) => setGerarTopico(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" disabled={!gerarDisc}><option value="">Selecione...</option>{gerarTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Quantidade</label><input type="number" min={1} max={10} value={gerarQtd} onChange={(e) => setGerarQtd(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} className="input-base border-ink-200 dark:border-ink-700" /></div>
          </div>
          <button onClick={handleGerar} disabled={gerando || !gerarDisc || !gerarTopico} className="btn-primary">{gerando ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar questões</>}</button>
          {gerarErro && <p className="text-xs text-error-600 dark:text-error-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {gerarErro}</p>}
          {questoesGeradas.length > 0 && (
            <div className="space-y-4">
              {questoesGeradas.map((q, i) => (
                <div key={i} className="border border-ink-100 dark:border-ink-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200 mb-3">{i + 1}. {q.enunciado}</p>
                  <div className="space-y-1.5 mb-3">
                    {q.alternativas.map((a) => (
                      <div key={a.letra} className={`text-sm px-3 py-2 rounded-lg ${a.letra === q.correta ? "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 font-medium" : "bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-400"}`}><span className="font-semibold">{a.letra})</span> {a.texto}</div>
                    ))}
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400 bg-brand-50/50 dark:bg-brand-900/10 rounded-lg p-3 mb-2"><span className="font-semibold">Resposta correta: {q.correta}</span> — {q.explicacao}</div>
                  <button onClick={() => handleExplicar(q, i)} disabled={explicando === i} className="btn-ghost text-xs">{explicando === i ? <><Loader2 className="w-3 h-3 animate-spin" /> Explicando...</> : <><Award className="w-3 h-3" /> Explicar alternativas</>}</button>
                  {explicando === null && explicacao && questoesGeradas[i] === q && <div className="text-xs text-ink-600 dark:text-ink-400 mt-2 p-3 rounded-lg bg-ink-50 dark:bg-ink-800 whitespace-pre-wrap">{explicacao}</div>}
                  {explicacaoErro && <p className="text-xs text-error-600 dark:text-error-400 mt-1">{explicacaoErro}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Histórico de questões individuais</h3>
        <div className="space-y-2">
          {questoes.map((q) => {
            const disc = disciplines.find((d) => d.id === q.disciplina_id); const top = topics.find((t) => t.id === q.topico_id);
            return (
              <div key={q.id} className="flex items-center gap-3 py-2 border-b border-ink-50 dark:border-ink-800 last:border-0 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${q.acertou ? "bg-success-50 dark:bg-success-900/30" : "bg-error-50 dark:bg-error-900/30"}`}>{q.acertou ? <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400" /> : <XCircle className="w-4 h-4 text-error-600 dark:text-error-400" />}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{disc?.nome ?? "—"} · {top?.nome ?? "—"}</p><p className="text-xs text-ink-400">{new Date(q.criado_em).toLocaleDateString("pt-BR")}{q.fonte ? ` · ${q.fonte}` : ""}</p></div>
                <button onClick={() => handleDelete(q.id)} className="text-ink-300 dark:text-ink-600 hover:text-error-600 dark:hover:text-error-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
          {questoes.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Nenhuma questão registrada.</p>}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lançamentos em lote</h3>
        <div className="space-y-2">
          {lancamentos.map((l) => {
            const disc = disciplines.find((d) => d.id === l.disciplina_id); const top = topics.find((t) => t.id === l.topico_id); const taxa = l.quantidade > 0 ? (l.acertos / l.quantidade) * 100 : 0;
            return (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-ink-50 dark:border-ink-800 last:border-0 group">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-800 dark:text-ink-200">{disc?.nome ?? "—"} · {top?.nome ?? "—"}</p><p className="text-xs text-ink-400">{l.quantidade} questões · {l.acertos} acertos · {l.erros} erros · {taxa.toFixed(0)}% · {new Date(l.criado_em).toLocaleDateString("pt-BR")}{l.fonte ? ` · ${l.fonte}` : ""}</p></div>
                <button onClick={() => handleDeleteLanc(l.id)} className="text-ink-300 dark:text-ink-600 hover:text-error-600 dark:hover:text-error-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
          {lancamentos.length === 0 && <p className="text-sm text-ink-400 text-center py-4">Nenhum lançamento em lote registrado.</p>}
        </div>
      </div>
    </div>
  );
}
