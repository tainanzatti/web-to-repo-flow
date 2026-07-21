import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileQuestion, Check, X, Loader2, ListChecks, CheckCircle,
  Trash2, AlertTriangle, Filter, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, BookOpen, Clock, Search,
} from "lucide-react";
import {
  fetchDisciplines, fetchAllTopics, fetchQuestoes,
  fetchQuestaoLancamentos, insertQuestaoLancamento, deleteQuestaoLancamento,
  type QuestaoLancamentoRow,
} from "../../lib/db";
import type { Discipline, Topic, QuestaoRow } from "../../lib/curriculum";
import { dominioLabel } from "../../lib/curriculum";
import { StatCard } from "../ui/StatCard";
import { BarChart, LineChart } from "../ui/Charts";

type ResultadoFiltro = "todos" | "acertos" | "erros";

export function QuestoesView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [lancamentos, setLancamentos] = useState<QuestaoLancamentoRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selDisc, setSelDisc] = useState("");
  const [selTopic, setSelTopic] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [acertos, setAcertos] = useState(0);
  const [fonte, setFonte] = useState("AOCP");
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filtroDisc, setFiltroDisc] = useState("");
  const [filtroTopico, setFiltroTopico] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroDataIni, setFiltroDataIni] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroResultado, setFiltroResultado] = useState<ResultadoFiltro>("todos");
  const [busca, setBusca] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Selected discipline for desempenho detail
  const [discDetailId, setDiscDetailId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    const [d, t, q, l] = await Promise.all([
      fetchDisciplines(), fetchAllTopics(), fetchQuestoes(), fetchQuestaoLancamentos(),
    ]);
    setDisciplines(d); setTopics(t); setQuestoes(q); setLancamentos(l); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTopics = selDisc ? topics.filter((t) => t.disciplina_id === selDisc) : [];
  const filtroTopicos = filtroDisc ? topics.filter((t) => t.disciplina_id === filtroDisc) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selDisc || quantidade < 1 || acertos < 0 || acertos > quantidade) return;
    setSubmitting(true);
    await insertQuestaoLancamento(selDisc, selTopic || null, quantidade, acertos, fonte);
    setSelTopic(""); setQuantidade(10); setAcertos(0);
    setSubmitting(false);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteQuestaoLancamento(deleteId);
      await load();
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch {}
    setDeleting(false);
    setDeleteId(null);
  };

  // Filtered lançamentos
  const filteredLancamentos = useMemo(() => {
    let result = [...lancamentos];

    if (filtroDisc) result = result.filter((l) => l.disciplina_id === filtroDisc);
    if (filtroTopico) result = result.filter((l) => l.topico_id === filtroTopico);
    if (filtroData) result = result.filter((l) => l.criado_em.slice(0, 10) === filtroData);
    if (filtroDataIni) result = result.filter((l) => l.criado_em.slice(0, 10) >= filtroDataIni);
    if (filtroDataFim) result = result.filter((l) => l.criado_em.slice(0, 10) <= filtroDataFim);
    if (filtroResultado === "acertos") result = result.filter((l) => l.erros === 0);
    if (filtroResultado === "erros") result = result.filter((l) => l.acertos === 0);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      result = result.filter((l) => {
        const disc = disciplines.find((d) => d.id === l.disciplina_id)?.nome.toLowerCase() ?? "";
        const top = topics.find((t) => t.id === l.topico_id)?.nome.toLowerCase() ?? "";
        return disc.includes(q) || top.includes(q);
      });
    }

    return result;
  }, [lancamentos, filtroDisc, filtroTopico, filtroData, filtroDataIni, filtroDataFim, filtroResultado, busca, disciplines, topics]);

  // Pagination
  const totalPages = Math.ceil(filteredLancamentos.length / PAGE_SIZE);
  const pagedLancamentos = filteredLancamentos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalQuestoes = lancamentos.reduce((a, b) => a + b.quantidade, 0);
  const totalAcertos = lancamentos.reduce((a, b) => a + b.acertos, 0);
  const totalErros = lancamentos.reduce((a, b) => a + b.erros, 0);
  const taxaGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

  // Charts data
  const acertosPorDia = useMemo(() => {
    const map = new Map<string, { acertos: number; total: number }>();
    for (const l of lancamentos) {
      const day = l.criado_em.slice(0, 10);
      if (!map.has(day)) map.set(day, { acertos: 0, total: 0 });
      map.get(day)!.acertos += l.acertos;
      map.get(day)!.total += l.quantidade;
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(-14).map(([day, v]) => ({
      label: day.slice(5),
      value: v.acertos,
    }));
  }, [lancamentos]);

  const aproveitamentoPorDia = useMemo(() => {
    const map = new Map<string, { acertos: number; total: number }>();
    for (const l of lancamentos) {
      const day = l.criado_em.slice(0, 10);
      if (!map.has(day)) map.set(day, { acertos: 0, total: 0 });
      map.get(day)!.acertos += l.acertos;
      map.get(day)!.total += l.quantidade;
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.slice(-14).map(([day, v]) => ({
      label: day.slice(5),
      value: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }));
  }, [lancamentos]);

  const questoesPorDisciplina = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lancamentos) {
      map.set(l.disciplina_id, (map.get(l.disciplina_id) ?? 0) + l.quantidade);
    }
    return disciplines.map((d) => ({
      label: d.nome.length > 15 ? d.nome.slice(0, 13) + "..." : d.nome,
      value: map.get(d.id) ?? 0,
    }));
  }, [lancamentos, disciplines]);

  const questoesPorTopico = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lancamentos) {
      if (!l.topico_id) continue;
      map.set(l.topico_id, (map.get(l.topico_id) ?? 0) + l.quantidade);
    }
    return topics
      .map((t) => ({
        label: t.nome.length > 15 ? t.nome.slice(0, 13) + "..." : t.nome,
        value: map.get(t.id) ?? 0,
      }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [lancamentos, topics]);

  // Desempenho por disciplina
  const discDetail = discDetailId ? disciplines.find((d) => d.id === discDetailId) : null;
  const discDetailLancs = discDetailId ? lancamentos.filter((l) => l.disciplina_id === discDetailId) : [];
  const discDetailStats = useMemo(() => {
    if (!discDetailId) return null;
    const total = discDetailLancs.reduce((a, b) => a + b.quantidade, 0);
    const acertos = discDetailLancs.reduce((a, b) => a + b.acertos, 0);
    const erros = discDetailLancs.reduce((a, b) => a + b.erros, 0);
    const taxa = total > 0 ? (acertos / total) * 100 : 0;
    return { total, acertos, erros, taxa };
  }, [discDetailId, discDetailLancs]);

  // Desempenho por tópico within discipline
  const discDetailTopicos = useMemo(() => {
    if (!discDetailId) return [];
    const discTopics = topics.filter((t) => t.disciplina_id === discDetailId);
    return discTopics
      .map((t) => {
        const tLancs = lancamentos.filter((l) => l.topico_id === t.id);
        const total = tLancs.reduce((a, b) => a + b.quantidade, 0);
        const acertos = tLancs.reduce((a, b) => a + b.acertos, 0);
        const erros = tLancs.reduce((a, b) => a + b.erros, 0);
        const taxa = total > 0 ? (acertos / total) * 100 : 0;
        const ultimaVez = tLancs.length > 0
          ? tLancs.map((l) => l.criado_em).sort((a, b) => b.localeCompare(a))[0]
          : null;
        const revisoes = tLancs.length;
        const domMedio = revisoes > 0
          ? tLancs.reduce((a, b) => a + (b.acertos / b.quantidade) * 100, 0) / revisoes
          : 0;
        return { topic: t, total, acertos, erros, taxa, ultimaVez, revisoes, domMedio };
      })
      .sort((a, b) => a.taxa - b.taxa);
  }, [discDetailId, topics, lancamentos]);

  // Evolução within discipline
  const discEvolucao = useMemo(() => {
    if (!discDetailId) return [];
    const map = new Map<string, { acertos: number; total: number }>();
    for (const l of discDetailLancs) {
      const day = l.criado_em.slice(0, 10);
      if (!map.has(day)) map.set(day, { acertos: 0, total: 0 });
      map.get(day)!.acertos += l.acertos;
      map.get(day)!.total += l.quantidade;
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([day, v]) => ({
      label: day.slice(5),
      value: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }));
  }, [discDetailId, discDetailLancs]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Questões</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Registre questões resolvidas, acompanhe seu histórico e desempenho.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<ListChecks className="w-5 h-5" />} label="Total de questões" value={`${totalQuestoes}`} color="brand" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Total de acertos" value={`${totalAcertos}`} color="success" />
        <StatCard icon={<X className="w-5 h-5" />} label="Total de erros" value={`${totalErros}`} color="error" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Aproveitamento geral" value={`${taxaGeral.toFixed(0)}%`} color="warning" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><FileQuestion className="w-4 h-4" /> Registrar novo lançamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina</label>
            <select value={selDisc} onChange={(e) => { setSelDisc(e.target.value); setSelTopic(""); }} className="input-base border-ink-200 dark:border-ink-700" required>
              <option value="">Selecione...</option>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico (opcional)</label>
            <select value={selTopic} onChange={(e) => setSelTopic(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" disabled={!selDisc}>
              <option value="">Geral</option>
              {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Questões</label>
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))} className="input-base border-ink-200 dark:border-ink-700" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Acertos</label>
            <input type="number" min={0} max={quantidade} value={acertos} onChange={(e) => setAcertos(Math.min(quantidade, Math.max(0, Number(e.target.value))))} className="input-base border-ink-200 dark:border-ink-700" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Erros (auto)</label>
            <input type="text" value={Math.max(0, quantidade - acertos)} disabled className="input-base border-ink-200 dark:border-ink-700 opacity-60" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Banca</label>
            <input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" />
          </div>
        </div>
        <button type="submit" disabled={submitting || !selDisc} className="btn-primary">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileQuestion className="w-4 h-4" />} Registrar
        </button>
      </form>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Acertos por dia</h3>
          <LineChart data={acertosPorDia} height={200} color="stroke-success-500" />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Aproveitamento (%)</h3>
          <LineChart data={aproveitamentoPorDia} height={200} color="stroke-brand-500" formatValue={(v) => `${Math.round(v)}%`} />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Questões por disciplina</h3>
          <BarChart data={questoesPorDisciplina} height={200} />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Questões por tópico (top 10)</h3>
          <BarChart data={questoesPorTopico.map((d) => ({ ...d, color: "bg-warning-500" }))} height={200} />
        </div>
      </div>

      {/* Desempenho por disciplina */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Desempenho por disciplina</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {disciplines.map((d) => {
            const dLancs = lancamentos.filter((l) => l.disciplina_id === d.id);
            const dTotal = dLancs.reduce((a, b) => a + b.quantidade, 0);
            const dAcertos = dLancs.reduce((a, b) => a + b.acertos, 0);
            const dErros = dLancs.reduce((a, b) => a + b.erros, 0);
            const dTaxa = dTotal > 0 ? (dAcertos / dTotal) * 100 : 0;
            const isActive = discDetailId === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDiscDetailId(isActive ? null : d.id)}
                className={`text-left card p-4 transition-all hover:shadow-md ${isActive ? "ring-2 ring-brand-500" : ""}`}
              >
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100 mb-2">{d.nome}</p>
                <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400 mb-2">
                  <span>{dTotal} questões</span>
                  <span>{dTaxa.toFixed(0)}% aproveitamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dTaxa >= 70 ? "bg-success-500" : dTaxa >= 50 ? "bg-warning-500" : "bg-error-500"}`} style={{ width: `${dTaxa}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-success-600 dark:text-success-400">{dAcertos} acertos</span>
                  <span className="text-error-600 dark:text-error-400">{dErros} erros</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Discipline detail */}
        {discDetail && discDetailStats && (
          <div className="mt-6 space-y-4 animate-slideUp">
            <div className="flex items-center gap-2 pb-2 border-b border-ink-100 dark:border-ink-800">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100">{discDetail.nome}</h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3">
                <p className="text-xs text-ink-500 dark:text-ink-400">Total de questões</p>
                <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{discDetailStats.total}</p>
              </div>
              <div className="rounded-xl bg-success-50 dark:bg-success-900/20 p-3">
                <p className="text-xs text-ink-500 dark:text-ink-400">Acertos</p>
                <p className="text-lg font-bold text-success-600 dark:text-success-400">{discDetailStats.acertos}</p>
              </div>
              <div className="rounded-xl bg-error-50 dark:bg-error-900/20 p-3">
                <p className="text-xs text-ink-500 dark:text-ink-400">Erros</p>
                <p className="text-lg font-bold text-error-600 dark:text-error-400">{discDetailStats.erros}</p>
              </div>
              <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3">
                <p className="text-xs text-ink-500 dark:text-ink-400">Aproveitamento</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{discDetailStats.taxa.toFixed(0)}%</p>
              </div>
            </div>

            {/* Evolução within discipline */}
            {discEvolucao.length > 0 && (
              <div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-4">
                <p className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Evolução do aproveitamento</p>
                <LineChart data={discEvolucao} height={150} color="stroke-brand-500" formatValue={(v) => `${Math.round(v)}%`} />
              </div>
            )}

            {/* Tópicos within discipline */}
            <div>
              <h5 className="text-xs font-bold text-ink-700 dark:text-ink-300 mb-2">Tópicos (ordenados do pior para o melhor)</h5>
              <div className="space-y-2">
                {discDetailTopicos.map((t) => (
                  <div key={t.topic.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{t.topic.nome}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-500 dark:text-ink-400">
                        <span>{t.total} questões</span>
                        <span className="text-success-600 dark:text-success-400">{t.acertos} ac</span>
                        <span className="text-error-600 dark:text-error-400">{t.erros} err</span>
                        <span>{t.revisoes} revisões</span>
                        {t.ultimaVez && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {new Date(t.ultimaVez).toLocaleDateString("pt-BR")}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${t.taxa >= 70 ? "text-success-600 dark:text-success-400" : t.taxa >= 50 ? "text-warning-600 dark:text-warning-400" : "text-error-600 dark:text-error-400"}`}>{t.taxa.toFixed(0)}%</p>
                      <p className="text-[10px] text-ink-400">{dominioLabel(t.domMedio)}</p>
                    </div>
                  </div>
                ))}
                {discDetailTopicos.length === 0 && <p className="text-xs text-ink-400 text-center py-3">Nenhum tópico cadastrado para esta disciplina.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Lançamentos */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><ListChecks className="w-4 h-4" /> Histórico de Lançamentos</h3>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-ghost text-xs">
            <Filter className="w-3.5 h-3.5" /> Filtros {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input type="text" placeholder="Buscar por disciplina ou tópico..." value={busca} onChange={(e) => setBusca(e.target.value)} className="input-base pl-10 border-ink-200 dark:border-ink-700" />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 mb-4 p-4 rounded-xl bg-ink-50 dark:bg-ink-800 animate-slideUp">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Disciplina</label>
                <select value={filtroDisc} onChange={(e) => { setFiltroDisc(e.target.value); setFiltroTopico(""); }} className="input-base border-ink-200 dark:border-ink-700 text-sm">
                  <option value="">Todas</option>
                  {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Tópico</label>
                <select value={filtroTopico} onChange={(e) => setFiltroTopico(e.target.value)} className="input-base border-ink-200 dark:border-ink-700 text-sm" disabled={!filtroDisc}>
                  <option value="">Todos</option>
                  {filtroTopicos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Resultado</label>
                <select value={filtroResultado} onChange={(e) => setFiltroResultado(e.target.value as ResultadoFiltro)} className="input-base border-ink-200 dark:border-ink-700 text-sm">
                  <option value="todos">Todos</option>
                  <option value="acertos">Apenas acertos (100%)</option>
                  <option value="erros">Apenas erros (0% acertos)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Data específica</label>
                <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="input-base border-ink-200 dark:border-ink-700 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Data inicial</label>
                <input type="date" value={filtroDataIni} onChange={(e) => setFiltroDataIni(e.target.value)} className="input-base border-ink-200 dark:border-ink-700 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-600 dark:text-ink-400 mb-1 block">Data final</label>
                <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="input-base border-ink-200 dark:border-ink-700 text-sm" />
              </div>
            </div>
            <button onClick={() => { setFiltroDisc(""); setFiltroTopico(""); setFiltroData(""); setFiltroDataIni(""); setFiltroDataFim(""); setFiltroResultado("todos"); setBusca(""); }} className="btn-ghost text-xs">Limpar filtros</button>
          </div>
        )}

        {/* Success message */}
        {deleteSuccess && (
          <div className="mb-4 rounded-xl bg-success-50 dark:bg-success-900/30 px-4 py-3 text-sm text-success-700 dark:text-success-300 animate-fadeIn flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Lançamento excluído. Estatísticas recalculadas automaticamente.
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {pagedLancamentos.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-8">Nenhum lançamento encontrado com os filtros selecionados.</p>
          ) : (
            pagedLancamentos.map((l) => {
              const disc = disciplines.find((d) => d.id === l.disciplina_id);
              const topic = topics.find((t) => t.id === l.topico_id);
              const taxa = l.quantidade > 0 ? (l.acertos / l.quantidade) * 100 : 0;
              const data = new Date(l.criado_em);
              return (
                <div key={l.id} className="border border-ink-100 dark:border-ink-800 rounded-xl p-4 hover:border-brand-200 dark:hover:border-brand-700 transition-colors group animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-ink-400 mb-1">
                        <span>{data.toLocaleDateString("pt-BR")} - {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {l.fonte && <span className="px-1.5 py-0.5 rounded bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400">{l.fonte}</span>}
                      </div>
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{disc?.nome ?? "—"}</p>
                      {topic && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{topic.nome}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-ink-600 dark:text-ink-400">Questões: <strong>{l.quantidade}</strong></span>
                        <span className="text-success-600 dark:text-success-400">Acertos: <strong>{l.acertos}</strong></span>
                        <span className="text-error-600 dark:text-error-400">Erros: <strong>{l.erros}</strong></span>
                        <span className={`font-bold ${taxa >= 70 ? "text-success-600 dark:text-success-400" : taxa >= 50 ? "text-warning-600 dark:text-warning-400" : "text-error-600 dark:text-error-400"}`}>Aproveitamento: {taxa.toFixed(0)}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteId(l.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-error-600 dark:hover:text-error-400 transition-all p-1 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/30"
                      aria-label="Excluir lançamento"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5">Anterior</button>
            <span className="text-xs text-ink-500 dark:text-ink-400">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-ghost text-xs px-3 py-1.5">Próxima</button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-error-50 dark:bg-error-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error-600 dark:text-error-400" />
              </div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">Excluir lançamento?</h3>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-5">
              Tem certeza que deseja excluir este lançamento? Esta ação atualizará automaticamente todas as estatísticas e não poderá ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary" disabled={deleting}>Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
