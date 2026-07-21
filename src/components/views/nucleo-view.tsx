import { useEffect, useState, useCallback } from "react";
import { Shield, SkipForward, Lock, BookOpen, CheckCircle, Clock, AlertCircle, FileText, Link as LinkIcon, Upload, Trash2, Sparkles, ExternalLink, File, Loader2 } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchSkipCounts, incrementSkipCount, insertLancamento, resetSkipCount, fetchLeiSeca, insertLeiSecaLink, uploadLeiSecaFile, deleteLeiSeca, fetchResumo, insertResumo, fetchLeiSecaContexto, type LeiSecaRow } from "../../lib/db";
import { computeDisciplinaData, nextHeroDiscipline, maxTopicsForDiscipline, allocateTopics, tierFromMastery, dominioMedio, type Discipline, type Topic, type Lancamento } from "../../lib/curriculum";
import { gerarResumo } from "../../lib/ai-client";

export function NucleoView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [allLancamentos, setAllLancamentos] = useState<Lancamento[]>([]);
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmSkip, setConfirmSkip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (excludeId?: string) => {
    const [discs, topics, lancs, skips] = await Promise.all([
      fetchDisciplines(), fetchAllTopics(), fetchLancamentos(), fetchSkipCounts(),
    ]);
    setDisciplines(discs); setAllTopics(topics); setAllLancamentos(lancs); setSkipCounts(skips);
    const allData = discs.map((d) => {
      const dT = topics.filter((t) => t.disciplina_id === d.id);
      const dL = lancs.filter((l) => l.disciplina_id === d.id);
      return computeDisciplinaData(d, dT, dL, (skips[d.id] ?? 0) > 0 ? 1.5 : 1);
    });
    const hero = nextHeroDiscipline(allData, excludeId);
    setActiveId(hero?.discipline.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeDisc = disciplines.find((d) => d.id === activeId);
  const activeTopics = activeDisc ? allTopics.filter((t) => t.disciplina_id === activeDisc.id) : [];
  const activeLancs = activeDisc ? allLancamentos.filter((l) => l.disciplina_id === activeDisc.id) : [];
  const activeData = activeDisc ? computeDisciplinaData(activeDisc, activeTopics, activeLancs, (skipCounts[activeDisc.id] ?? 0) > 0 ? 1.5 : 1) : null;

  const maxTopics = activeData ? maxTopicsForDiscipline(activeData) : 1;
  const allocated = activeData ? allocateTopics(activeTopics, activeLancs, maxTopics) : [];

  const handleSkip = async () => {
    if (!confirmSkip) return;
    await incrementSkipCount(confirmSkip);
    await loadData(confirmSkip);
    setConfirmSkip(null);
  };

  const handleStudy = async (topicoId: string, mastery: number) => {
    if (!activeId) return;
    await insertLancamento(activeId, topicoId, mastery);
    await loadData();
  };

  const handleCompleteDiscipline = async () => {
    if (!activeId) return;
    await resetSkipCount(activeId);
    await loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Núcleo de Estudo</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">A disciplina em destaque é escolhida automaticamente com base no peso do edital, domínio e esquecimento.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {disciplines.map((d) => {
          const dT = allTopics.filter((t) => t.disciplina_id === d.id);
          const dL = allLancamentos.filter((l) => l.disciplina_id === d.id);
          const dom = dominioMedio(dL);
          const isActive = d.id === activeId;
          const sc = skipCounts[d.id] ?? 0;
          return (
            <div key={d.id} className={`card p-4 transition-all ${isActive ? "ring-2 ring-brand-500 shadow-md" : "opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-400">{d.peso_edital}q</span>
                {isActive ? <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" /> : <Lock className="w-4 h-4 text-ink-300 dark:text-ink-600" />}
              </div>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100 leading-snug mb-2">{d.nome}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${dom}%` }} /></div>
                <span className="text-xs text-ink-500 dark:text-ink-400">{Math.round(dom)}%</span>
              </div>
              {sc > 0 && <p className="text-xs text-warning-600 dark:text-warning-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pulou {sc}x</p>}
            </div>
          );
        })}
      </div>

      {activeDisc && activeData && (
        <div className="card p-6 animate-fadeIn">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" /><h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{activeDisc.nome}</h2></div>
              <p className="text-sm text-ink-500 dark:text-ink-400">Domínio: {Math.round(activeData.dominioMedio)}% · Tópicos não dominados: {activeData.topicosNaoDominados} · Score: {activeData.score.toFixed(2)}</p>
            </div>
            <button onClick={() => setConfirmSkip(activeDisc.id)} className="btn-ghost text-sm"><SkipForward className="w-4 h-4" /> Pular</button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-300">Tópicos sugeridos para esta sessão ({allocated.length}):</p>
            {allocated.map((t) => {
              const tLancs = activeLancs.filter((l) => l.topico_id === t.id);
              const tDom = tLancs.length > 0 ? tLancs.reduce((a, b) => a + Number(b.mastery), 0) / tLancs.length : 0;
              const tier = tierFromMastery(tDom);
              const tc = { ruim: "text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-900/30", medio: "text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/30", bom: "text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/30", otimo: "text-success-700 bg-success-100 dark:text-success-300 dark:bg-success-900/40" }[tier];
              return (
                <div key={t.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-800">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{t.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tc}`}>{tier}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStudy(t.id, 40)} className="btn-secondary text-xs px-3 py-1.5">Estudei</button>
                      <button onClick={() => handleStudy(t.id, 70)} className="btn-secondary text-xs px-3 py-1.5">Revisei</button>
                      <button onClick={() => handleStudy(t.id, 90)} className="btn-primary text-xs px-3 py-1.5"><CheckCircle className="w-3 h-3" /> Dominei</button>
                    </div>
                  </div>
                  <TopicCard topic={t} discipline={activeDisc} />
                </div>
              );
            })}
          </div>

          <button onClick={handleCompleteDiscipline} className="btn-ghost text-sm mt-4 text-success-600 dark:text-success-400"><CheckCircle className="w-4 h-4" /> Concluir disciplina</button>
        </div>
      )}

      {confirmSkip && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-3"><Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" /><h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">Pular disciplina?</h3></div>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-5">A disciplina será priorizada com multiplicador de urgência x1.5. Você poderá voltar a ela depois.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmSkip(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSkip} className="btn-danger">Pular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, discipline }: { topic: Topic; discipline: Discipline }) {
  const [tab, setTab] = useState<"lei-seca" | "resumo">("lei-seca");
  const [leiSeca, setLeiSeca] = useState<LeiSecaRow[]>([]);
  const [resumo, setResumo] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loadingLeiSeca, setLoadingLeiSeca] = useState(true);
  const [loadingResumo, setLoadingResumo] = useState(true);

  const loadLeiSeca = useCallback(async () => {
    const data = await fetchLeiSeca(topic.id);
    setLeiSeca(data);
    setLoadingLeiSeca(false);
  }, [topic.id]);

  const loadResumo = useCallback(async () => {
    const r = await fetchResumo(topic.id);
    setResumo(r);
    setLoadingResumo(false);
  }, [topic.id]);

  useEffect(() => { loadLeiSeca(); loadResumo(); }, [loadLeiSeca, loadResumo]);

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    setErro(null);
    await insertLeiSecaLink(topic.id, linkTitle.trim(), linkUrl.trim());
    setLinkTitle(""); setLinkUrl("");
    await loadLeiSeca();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErro(null);
    try { await uploadLeiSecaFile(topic.id, file); await loadLeiSeca(); }
    catch (err) { setErro((err as Error).message); }
    setUploading(false); e.target.value = "";
  };

  const handleDelete = async (id: string) => { await deleteLeiSeca(id); await loadLeiSeca(); };

  const handleGerarResumo = async () => {
    setGerando(true); setErro(null);
    const ctx = await fetchLeiSecaContexto(topic.id);
    const { resumo: txt, error } = await gerarResumo(topic.nome, discipline.nome, ctx);
    if (error || !txt) { setErro(error ?? "Erro ao gerar resumo"); setGerando(false); return; }
    await insertResumo(discipline.id, topic.id, txt);
    setResumo(txt); setGerando(false);
  };

  return (
    <div className="card p-4 animate-slideUp">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{topic.nome}</h4>
        <div className="flex gap-1">
          <button onClick={() => setTab("lei-seca")} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === "lei-seca" ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"}`}><FileText className="w-3.5 h-3.5 inline mr-1" /> Lei Seca</button>
          <button onClick={() => setTab("resumo")} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === "resumo" ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"}`}><Sparkles className="w-3.5 h-3.5 inline mr-1" /> Resumo IA</button>
        </div>
      </div>

      {tab === "lei-seca" && (
        <div className="space-y-3">
          {loadingLeiSeca ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
          ) : (
            <>
              {leiSeca.length > 0 && (
                <div className="space-y-2">
                  {leiSeca.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-50 dark:bg-ink-800 group">
                      {item.tipo === "link" ? <LinkIcon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" /> : <File className="w-4 h-4 text-success-600 dark:text-success-400 shrink-0" />}
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-700 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 truncate flex-1">{item.titulo}</a>
                      <ExternalLink className="w-3 h-3 text-ink-300 dark:text-ink-600 shrink-0" />
                      <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-error-600 dark:hover:text-error-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="Título" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} className="flex-1 rounded-lg border border-ink-200 dark:border-ink-700 dark:bg-ink-800 px-3 py-1.5 text-xs text-ink-800 dark:text-ink-200 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                <input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 rounded-lg border border-ink-200 dark:border-ink-700 dark:bg-ink-800 px-3 py-1.5 text-xs text-ink-800 dark:text-ink-200 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                <button onClick={handleAddLink} disabled={!linkTitle.trim() || !linkUrl.trim()} className="btn-secondary text-xs px-3 py-1.5 shrink-0"><LinkIcon className="w-3 h-3" /> Add</button>
              </div>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-lg py-3 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <Upload className="w-4 h-4 text-ink-400" />}
                <span className="text-xs text-ink-500 dark:text-ink-400">{uploading ? "Enviando..." : "Anexar arquivo (PDF, imagem...)"}</span>
                <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            </>
          )}
        </div>
      )}

      {tab === "resumo" && (
        <div className="space-y-3">
          {loadingResumo ? (
            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
          ) : resumo ? (
            <div className="text-sm text-ink-700 dark:text-ink-300 whitespace-pre-wrap leading-relaxed">{resumo}</div>
          ) : (
            <p className="text-xs text-ink-400 text-center py-4">Nenhum resumo gerado ainda. A IA criará um resumo baseado no tópico e nos materiais da Lei Seca.</p>
          )}
          {erro && <p className="text-xs text-error-600 dark:text-error-400">{erro}</p>}
          <button onClick={handleGerarResumo} disabled={gerando} className="btn-primary w-full text-xs">
            {gerando ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Sparkles className="w-3.5 h-3.5" /> {resumo ? "Regenerar resumo" : "Gerar resumo com IA"}</>}
          </button>
        </div>
      )}
    </div>
  );
}
