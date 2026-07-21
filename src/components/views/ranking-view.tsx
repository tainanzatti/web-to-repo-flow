import { useEffect, useState, useCallback, useMemo } from "react";
import { Trophy, Search, Loader2, Crown, Medal, Star, Target, Clock, BookOpen, Flame, TrendingUp, Users, Award, X, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { fetchRanking, fetchUserEvolution, fetchUserDisciplinasPerformance, type RankingRow, type UserEvolutionRow, type UserDisciplinaPerf } from "../../lib/db";
import { useAuth } from "../../lib/auth-context";
import { LineChart } from "../ui/Charts";

type SortField = "xp_total" | "taxa_acertos" | "questoes_respondidas" | "questoes_corretas" | "horas_estudadas" | "topicos_estudados" | "dias_consecutivos" | "percentual_edital";
type Period = "all" | "week" | "month" | "year";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "xp_total", label: "XP" }, { value: "taxa_acertos", label: "Taxa de acerto" },
  { value: "questoes_respondidas", label: "Questões respondidas" }, { value: "questoes_corretas", label: "Questões corretas" },
  { value: "horas_estudadas", label: "Horas estudadas" }, { value: "topicos_estudados", label: "Tópicos estudados" },
  { value: "dias_consecutivos", label: "Streak (dias)" }, { value: "percentual_edital", label: "% edital concluído" },
];
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "all", label: "Geral" }, { value: "week", label: "Semanal" }, { value: "month", label: "Mensal" }, { value: "year", label: "Anual" },
];
const PATENTE_COLORS: Record<number, string> = {
  1: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400", 2: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  3: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400", 4: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  5: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400", 6: "bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
  7: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", 8: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  9: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", 10: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  11: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", 12: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
};
function getPatenteColor(level: number): string { return PATENTE_COLORS[level] ?? PATENTE_COLORS[1]; }
function getInitials(nome: string): string { const p = nome.trim().split(" "); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0]?.slice(0, 2).toUpperCase() ?? "??"; }
function formatDate(iso: string | null): string { if (!iso) return "—"; const d = new Date(iso); const now = new Date(); const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)); if (diff === 0) return "Hoje"; if (diff === 1) return "Ontem"; if (diff < 7) return `${diff} dias atrás`; if (diff < 30) return `${Math.floor(diff / 7)} sem atrás`; if (diff < 365) return `${Math.floor(diff / 30)} meses atrás`; return d.toLocaleDateString("pt-BR"); }

export function RankingView() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [sortField, setSortField] = useState<SortField>("xp_total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<RankingRow | null>(null);

  const load = useCallback(async () => { setLoading(true); setError(null); try { setRanking(await fetchRanking(period)); } catch (err) { setError((err as Error).message); } setLoading(false); }, [period]);
  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    const filtered = ranking.filter((r) => !search.trim() || r.nome.toLowerCase().includes(search.trim().toLowerCase()));
    return [...filtered].sort((a, b) => { const av = a[sortField] as number; const bv = b[sortField] as number; return sortDir === "desc" ? bv - av : av - bv; });
  }, [ranking, sortField, sortDir, search]);

  const xpRanking = useMemo(() => [...ranking].sort((a, b) => b.xp_total - a.xp_total), [ranking]);
  const myRank = useMemo(() => { if (!user) return -1; return xpRanking.findIndex((r) => r.user_id === user.id) + 1; }, [xpRanking, user]);

  const stats = useMemo(() => {
    if (ranking.length === 0) return { totalUsers: 0, avgAcertos: 0, totalQuestoes: 0, totalHoras: 0, avgXP: 0 };
    const totalUsers = ranking.length; const totalQuestoes = ranking.reduce((a, b) => a + b.questoes_respondidas, 0); const totalHoras = ranking.reduce((a, b) => a + b.horas_estudadas, 0); const totalXP = ranking.reduce((a, b) => a + b.xp_total, 0);
    const uq = ranking.filter((r) => r.questoes_respondidas > 0);
    return { totalUsers, avgAcertos: uq.length > 0 ? uq.reduce((a, b) => a + b.taxa_acertos, 0) / uq.length : 0, totalQuestoes, totalHoras, avgXP: totalXP / totalUsers };
  }, [ranking]);

  const handleSort = (field: SortField) => { if (sortField === field) setSortDir(sortDir === "desc" ? "asc" : "desc"); else { setSortField(field); setSortDir("desc"); } };
  const podium = xpRanking.slice(0, 3);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Ranking</h1></div><div className="card p-6 text-center text-error-600 dark:text-error-400">{error}</div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><Trophy className="w-7 h-7 text-warning-500" />Ranking Geral</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Compare seu desempenho com os demais concurseiros.</p></div>
      {myRank > 0 && <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-brand-50 to-transparent dark:from-brand-900/20 dark:to-transparent"><div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shrink-0">{myRank}º</div><div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Sua posição no ranking</p><p className="text-xs text-ink-500 dark:text-ink-400">{ranking.find((r) => r.user_id === user?.id)?.patente ?? "—"} · {ranking.find((r) => r.user_id === user?.id)?.xp_total ?? 0} XP</p></div></div>}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {podium.map((r, i) => {
            const place = i + 1; const heights = ["sm:mt-0", "sm:mt-8", "sm:mt-4"];
            const medals = [<Crown key="1" className="w-6 h-6 text-warning-500" />, <Medal key="2" className="w-6 h-6 text-ink-400" />, <Medal key="3" className="w-6 h-6 text-orange-600" />];
            const rings = ["ring-warning-400 dark:ring-warning-500", "ring-ink-300 dark:ring-ink-600", "ring-orange-400 dark:ring-orange-500"];
            return <div key={r.user_id} onClick={() => setSelectedUser(r)} className={`card p-6 text-center cursor-pointer hover:shadow-md transition-all animate-slideUp ${heights[i]} ring-2 ${rings[i]} ${r.user_id === user?.id ? "border-brand-400 dark:border-brand-500" : ""}`}>
              <div className="flex justify-center mb-3">{medals[i]}</div>
              <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white ${place === 1 ? "bg-gradient-to-br from-warning-400 to-warning-600" : place === 2 ? "bg-gradient-to-br from-ink-400 to-ink-500" : "bg-gradient-to-br from-orange-400 to-orange-600"}`}>{getInitials(r.nome)}</div>
              <p className="text-sm font-bold text-ink-900 dark:text-ink-100 truncate">{r.nome}</p><p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{r.patente}</p>
              <div className="mt-3 flex items-center justify-center gap-1"><Zap className="w-4 h-4 text-brand-500" /><span className="text-lg font-bold text-ink-900 dark:text-ink-100">{r.xp_total}</span><span className="text-xs text-ink-400">XP</span></div>
              <p className="text-xs font-bold text-ink-600 dark:text-ink-400 mt-2">{place}º lugar</p>
            </div>;
          })}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatMini icon={<Users className="w-5 h-5" />} label="Usuários" value={String(stats.totalUsers)} color="brand" />
        <StatMini icon={<Target className="w-5 h-5" />} label="Média acertos" value={`${stats.avgAcertos.toFixed(0)}%`} color="success" />
        <StatMini icon={<BookOpen className="w-5 h-5" />} label="Questões totais" value={String(stats.totalQuestoes)} color="warning" />
        <StatMini icon={<Clock className="w-5 h-5" />} label="Horas totais" value={stats.totalHoras.toFixed(0)} color="ink" />
        <StatMini icon={<Zap className="w-5 h-5" />} label="Média XP" value={String(Math.round(stats.avgXP))} color="brand" />
      </div>
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" /><input type="text" placeholder="Buscar usuário..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-base border-ink-200 dark:border-ink-700 pl-10" /></div>
          <div className="flex gap-2 flex-wrap">{PERIOD_OPTIONS.map((p) => <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${period === p.value ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700"}`}>{p.label}</button>)}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap"><span className="text-xs text-ink-400">Ordenar por:</span>{SORT_OPTIONS.map((opt) => <button key={opt.value} onClick={() => handleSort(opt.value)} className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${sortField === opt.value ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"}`}>{opt.label}{sortField === opt.value && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}</button>)}</div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-ink-100 dark:border-ink-800">
            <th className="text-left font-semibold text-ink-600 dark:text-ink-400 px-4 py-3">#</th><th className="text-left font-semibold text-ink-600 dark:text-ink-400 px-4 py-3">Usuário</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3">Patente</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600" onClick={() => handleSort("xp_total")}>XP</th>
            <th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden sm:table-cell" onClick={() => handleSort("taxa_acertos")}>Acertos</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden md:table-cell" onClick={() => handleSort("questoes_respondidas")}>Questões</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden md:table-cell" onClick={() => handleSort("questoes_corretas")}>Corretas</th>
            <th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden lg:table-cell" onClick={() => handleSort("topicos_estudados")}>Tópicos</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden lg:table-cell" onClick={() => handleSort("horas_estudadas")}>Horas</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden xl:table-cell" onClick={() => handleSort("dias_consecutivos")}>Streak</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 cursor-pointer hover:text-brand-600 hidden xl:table-cell" onClick={() => handleSort("percentual_edital")}>% Edital</th><th className="text-center font-semibold text-ink-600 dark:text-ink-400 px-4 py-3 hidden xl:table-cell">Última atividade</th>
          </tr></thead>
          <tbody>
            {sorted.map((r) => { const rank = xpRanking.findIndex((x) => x.user_id === r.user_id) + 1; const isMe = r.user_id === user?.id; return (
              <tr key={r.user_id} onClick={() => setSelectedUser(r)} className={`border-b border-ink-50 dark:border-ink-800 last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/50 transition-colors cursor-pointer ${isMe ? "bg-brand-50/50 dark:bg-brand-900/20" : ""}`}>
                <td className="px-4 py-3"><span className={`font-bold ${rank <= 3 ? "text-warning-500" : "text-ink-500 dark:text-ink-400"}`}>{rank}º</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{getInitials(r.nome)}</div><div className="min-w-0"><p className="font-medium text-ink-800 dark:text-ink-200 truncate">{r.nome} {isMe && <span className="text-xs text-brand-600 dark:text-brand-400">(Você)</span>}</p></div></div></td>
                <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full font-medium ${getPatenteColor(r.patente_level)}`}>{r.patente}</span></td>
                <td className="px-4 py-3 text-center font-bold text-ink-900 dark:text-ink-100">{r.xp_total}</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden sm:table-cell">{r.taxa_acertos.toFixed(0)}%</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden md:table-cell">{r.questoes_respondidas}</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden md:table-cell">{r.questoes_corretas}</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden lg:table-cell">{r.topicos_estudados}</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden lg:table-cell">{r.horas_estudadas.toFixed(1)}h</td>
                <td className="px-4 py-3 text-center hidden xl:table-cell">{r.dias_consecutivos > 0 ? <span className="inline-flex items-center gap-1 text-warning-600 dark:text-warning-400"><Flame className="w-3.5 h-3.5" /> {r.dias_consecutivos}</span> : <span className="text-ink-300 dark:text-ink-600">0</span>}</td>
                <td className="px-4 py-3 text-center text-ink-600 dark:text-ink-400 hidden xl:table-cell">{r.percentual_edital.toFixed(0)}%</td>
                <td className="px-4 py-3 text-center text-xs text-ink-400 hidden xl:table-cell">{formatDate(r.ultima_atividade)}</td>
              </tr>
            ); })}
          </tbody>
        </table>
        {sorted.length === 0 && <div className="text-center py-12"><Users className="w-10 h-10 text-ink-300 dark:text-ink-700 mx-auto mb-3" /><p className="text-sm text-ink-400">{search ? "Nenhum usuário encontrado." : "Nenhum usuário no ranking ainda."}</p></div>}
      </div>
      {selectedUser && <UserModal user={selectedUser} myRank={xpRanking.findIndex((x) => x.user_id === selectedUser.user_id) + 1} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function StatMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const cm: Record<string, string> = { brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300", success: "bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300", warning: "bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300", ink: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300", error: "bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300" };
  return <div className="card p-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cm[color] ?? cm.brand}`}>{icon}</div><p className="text-lg font-bold text-ink-900 dark:text-ink-100">{value}</p><p className="text-xs text-ink-500 dark:text-ink-400">{label}</p></div>;
}

function UserModal({ user: u, myRank, onClose }: { user: RankingRow; myRank: number; onClose: () => void }) {
  const [evolution, setEvolution] = useState<UserEvolutionRow[]>([]);
  const [disciplinas, setDisciplinas] = useState<UserDisciplinaPerf[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); Promise.all([fetchUserEvolution(u.user_id, 30).catch(() => []), fetchUserDisciplinasPerformance(u.user_id).catch(() => [])]).then(([evo, discs]) => { setEvolution(evo); setDisciplinas(discs); setLoading(false); }); }, [u.user_id]);
  const chartData = evolution.map((e) => ({ date: e.data, value: e.xp_gained }));
  const strongest = [...disciplinas].sort((a, b) => b.dominio - a.dominio).slice(0, 3);
  const weakest = [...disciplinas].sort((a, b) => a.dominio - b.dominio).slice(0, 3);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8" onClick={onClose}>
      <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-xl font-bold text-white shrink-0">{getInitials(u.nome)}</div><div><h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{u.nome}</h2><span className={`text-xs px-2 py-1 rounded-full font-medium ${getPatenteColor(u.patente_level)}`}>{u.patente}</span><p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{myRank}º no ranking · {u.xp_total} XP</p></div></div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <ModalStat icon={<Target className="w-4 h-4" />} label="Acertos" value={`${u.taxa_acertos.toFixed(0)}%`} />
          <ModalStat icon={<BookOpen className="w-4 h-4" />} label="Questões" value={String(u.questoes_respondidas)} />
          <ModalStat icon={<CheckCircleMini />} label="Corretas" value={String(u.questoes_corretas)} />
          <ModalStat icon={<Clock className="w-4 h-4" />} label="Horas" value={`${u.horas_estudadas.toFixed(1)}h`} />
          <ModalStat icon={<BookOpen className="w-4 h-4" />} label="Tópicos" value={String(u.topicos_estudados)} />
          <ModalStat icon={<Flame className="w-4 h-4" />} label="Streak" value={`${u.dias_consecutivos} dias`} />
          <ModalStat icon={<Award className="w-4 h-4" />} label="% Edital" value={`${u.percentual_edital.toFixed(0)}%`} />
          <ModalStat icon={<Zap className="w-4 h-4" />} label="XP Total" value={String(u.xp_total)} />
        </div>
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div> : (
          <>
            <div className="mb-6"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Evolução de XP (30 dias)</h3><div className="card p-4">{chartData.some((d) => d.value > 0) ? <LineChart data={chartData} height={160} color="#3385ff" /> : <p className="text-sm text-ink-400 text-center py-8">Sem dados de evolução ainda.</p>}</div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-success-500" /> Disciplinas mais fortes</h3><div className="space-y-2">{strongest.map((d) => <div key={d.disciplina_id} className="flex items-center justify-between p-2 rounded-lg bg-success-50 dark:bg-success-900/20"><span className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate">{d.disciplina_nome}</span><span className="text-xs font-bold text-success-600 dark:text-success-400">{d.dominio.toFixed(0)}%</span></div>)}{strongest.length === 0 && <p className="text-xs text-ink-400">Sem dados.</p>}</div></div>
              <div><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-error-500" /> Precisa melhorar</h3><div className="space-y-2">{weakest.map((d) => <div key={d.disciplina_id} className="flex items-center justify-between p-2 rounded-lg bg-error-50 dark:bg-error-900/20"><span className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate">{d.disciplina_nome}</span><span className="text-xs font-bold text-error-600 dark:text-error-400">{d.dominio.toFixed(0)}%</span></div>)}{weakest.length === 0 && <p className="text-xs text-ink-400">Sem dados.</p>}</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-50 dark:bg-ink-800"><div className="w-7 h-7 rounded-lg bg-white dark:bg-ink-900 flex items-center justify-center text-ink-500 dark:text-ink-400 shrink-0">{icon}</div><div className="min-w-0"><p className="text-xs text-ink-400 truncate">{label}</p><p className="text-sm font-bold text-ink-900 dark:text-ink-100">{value}</p></div></div>;
}
function CheckCircleMini() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>; }
