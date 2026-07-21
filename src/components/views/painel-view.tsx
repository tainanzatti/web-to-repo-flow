import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  TrendingUp,
  Target,
  Layers,
  AlertCircle,
  ChevronRight,
  Calculator,
} from "lucide-react";
import {
  fetchDisciplines,
  fetchTopics,
  fetchLancamentos,
  fetchUserPrefs,
  fetchFlashcardsPendentes,
  fetchSkipCounts,
  fetchQuestoes,
  type UserPrefs,
} from "../../lib/db";
import {
  computeDisciplinaData,
  nextHeroDiscipline,
  PROJECTION_NOTE,
  type DisciplinaComTopicos,
  type DisciplinaScore,
  type Lancamento,
} from "../../lib/curriculum";

export default function PainelView() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaComTopicos[]>([]);
  const [heroScore, setHeroScore] = useState<DisciplinaScore | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [flashcardsPendentes, setFlashcardsPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sliderHoras, setSliderHoras] = useState(4);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [discs, tops, lancs, skipMap, p, flashcards, quests] =
        await Promise.all([
          fetchDisciplines(),
          fetchTopics(),
          fetchLancamentos(),
          fetchSkipCounts(),
          fetchUserPrefs(),
          fetchFlashcardsPendentes(),
          fetchQuestoes(),
        ]);

      const discData = discs.map((d) => {
        const topicsForDisc = tops.filter((t) => t.disciplina_id === d.id);
        return computeDisciplinaData(d, topicsForDisc, lancs);
      });

      setDisciplinas(discData);
      setHeroScore(nextHeroDiscipline(discData, skipMap));
      setPrefs(p);
      setLancamentos(lancs);
      setFlashcardsPendentes(flashcards.length);
      setTotalQuestoes(quests.length);
      setSliderHoras(p.horas_estudo_dia);
    } catch (err) {
      console.error("Erro ao carregar painel:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const hojeLanc = lancamentos.filter(
      (l) => l.criado_em.slice(0, 10) === today
    );
    const horasHoje = hojeLanc.reduce((s, l) => s + l.minutos, 0) / 60;
    const horasTotal =
      lancamentos.reduce((s, l) => s + l.minutos, 0) / 60;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLanc = lancamentos.filter(
      (l) => new Date(l.criado_em) >= thirtyDaysAgo
    );
    const topicosNovosRecentes = recentLanc.filter(
      (l) => l.is_primeiro_contato
    ).length;
    const ritmoPorDia = topicosNovosRecentes / 30;

    const totalTopicos = disciplinas.reduce(
      (s, d) => s + d.topicos.length,
      0
    );
    const topicosTocados = new Set(
      lancamentos.filter((l) => l.topico_id).map((l) => l.topico_id)
    ).size;
    const topicosNaoTocados = totalTopicos - topicosTocados;

    const diasParaCobertura =
      ritmoPorDia > 0
        ? Math.ceil(topicosNaoTocados / ritmoPorDia)
        : 0;

    const minutosPorTopicoNovo =
      topicosNovosRecentes > 0
        ? recentLanc.filter((l) => l.is_primeiro_contato).reduce(
            (s, l) => s + l.minutos,
            0
          ) / topicosNovosRecentes
        : 25;

    const diasHipoteticos =
      sliderHoras > 0 && minutosPorTopicoNovo > 0
        ? Math.ceil(
            (topicosNaoTocados * minutosPorTopicoNovo) /
              (sliderHoras * 60)
          )
        : 0;

    const bons = disciplinas.reduce((s, d) => {
      return (
        s +
        d.topicos.filter(
          (t) =>
            t.tier === "bom" ||
            t.tier === "otimo" ||
            t.tier === "dominado"
        ).length
      );
    }, 0);
    const pctBomOtimo =
      totalTopicos > 0 ? (bons / totalTopicos) * 100 : 0;

    const revisoesVencendo = disciplinas.flatMap((d) =>
      d.topicos.filter(
        (t) =>
          t.ultimoContatoDias !== null &&
          t.ultimoContatoDias >= 7 &&
          t.tier !== "dominado"
      )
    );

    const aproveitamento =
      lancamentos.length > 0
        ? lancamentos.reduce((s, l) => s + l.mastery, 0) /
          lancamentos.length
        : 0;

    return {
      horasHoje,
      horasTotal,
      pctBomOtimo,
      diasParaCobertura,
      diasHipoteticos,
      topicosNaoTocados,
      ritmoPorDia,
      minutosPorTopicoNovo,
      revisoesVencendo,
      aproveitamento,
    };
  }, [lancamentos, disciplinas, sliderHoras]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-ink-400 text-sm">Carregando painel...</div>
      </div>
    );
  }

  const top4 = disciplinas.slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">
          Olá, {prefs?.nome ?? "Estudante"}
        </h1>
        {heroScore && (
          <p className="text-sm text-ink-500 mt-1">
            <span className="font-semibold text-brand-700">
              {heroScore.nome}
            </span>{" "}
            está esquecendo mais rápido — dedique ~45 min agora.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Clock}
          label="Horas hoje"
          value={stats.horasHoje.toFixed(1) + "h"}
          color="brand"
        />
        <StatCard
          icon={TrendingUp}
          label="Horas totais"
          value={stats.horasTotal.toFixed(1) + "h"}
          color="success"
        />
        <StatCard
          icon={Target}
          label="Aproveitamento"
          value={Math.round(stats.aproveitamento) + "%"}
          color="warning"
        />
        <StatCard
          icon={Layers}
          label="Edital bom/ótimo"
          value={Math.round(stats.pctBomOtimo) + "%"}
          color="brand"
        />
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink-900">Prévia do Núcleo</h3>
          <Link
            to="/nucleo"
            className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Ver tudo <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {top4.map((d) => (
            <div key={d.disciplina.id} className="p-3 rounded-xl bg-ink-50">
              <p className="text-xs font-medium text-ink-700 truncate">
                {d.disciplina.nome}
              </p>
              <div className="h-1.5 bg-ink-100 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.dominioMedio >= 80
                      ? "bg-success-500"
                      : d.dominioMedio >= 60
                      ? "bg-brand-500"
                      : d.dominioMedio >= 40
                      ? "bg-warning-500"
                      : "bg-error-500"
                  }`}
                  style={{
                    width: `${Math.min(100, d.dominioMedio)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-ink-500 mt-1">
                {Math.round(d.dominioMedio)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning-500" /> Revisões
            Vencendo
          </h3>
          {stats.revisoesVencendo.length === 0 ? (
            <p className="text-sm text-ink-400">
              Nenhuma revisão vencendo.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.revisoesVencendo.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-700 truncate">{t.nome}</span>
                  <span className="text-xs text-warning-600 shrink-0">
                    {t.ultimoContatoDias} dias
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" /> Flashcards
          </h3>
          <p className="text-3xl font-bold text-ink-900">
            {flashcardsPendentes}
          </p>
          <p className="text-sm text-ink-500 mt-1">
            cartões pendentes hoje
          </p>
          <Link to="/flashcards" className="btn-secondary mt-4">
            Estudar agora
          </Link>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600" /> Questões
          </h3>
          <p className="text-3xl font-bold text-ink-900">{totalQuestoes}</p>
          <p className="text-sm text-ink-500 mt-1">
            questões registradas
          </p>
          <Link to="/questoes" className="btn-secondary mt-4">
            Lançar questão
          </Link>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-ink-900 mb-2">
          Projeção de Cobertura
        </h3>
        {stats.ritmoPorDia > 0 ? (
          <p className="text-sm text-ink-600">
            No seu ritmo atual, você verá todos os tópicos pela primeira vez
            em{" "}
            <span className="font-bold text-brand-700">
              {stats.diasParaCobertura} dias
            </span>
            . ({stats.topicosNaoTocados} tópicos restantes ·{" "}
            {stats.ritmoPorDia.toFixed(1)} tópicos/dia)
          </p>
        ) : (
          <p className="text-sm text-ink-600">
            Você ainda não tem histórico suficiente. Comece a estudar para
            gerar uma projeção.
          </p>
        )}

        <div className="mt-5 pt-5 border-t border-ink-100">
          <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Calculadora de Ritmo
          </h4>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={sliderHoras}
              onChange={(e) => setSliderHoras(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-sm font-bold text-ink-900 w-16 text-right">
              {sliderHoras}h/dia
            </span>
          </div>
          <p className="text-sm text-ink-600 mt-3">
            Nesse ritmo hipotético:{" "}
            <span className="font-bold text-brand-700">
              {stats.diasHipoteticos > 0
                ? `${stats.diasHipoteticos} dias`
                : "—"}
            </span>{" "}
            para cobrir todos os tópicos pela primeira vez.
          </p>
        </div>

        <p className="text-xs text-ink-400 mt-4 italic">
          {PROJECTION_NOTE}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  color: "brand" | "success" | "warning";
}) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
  };
  return (
    <div className="card p-4">
      <div
        className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-xl font-bold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}
