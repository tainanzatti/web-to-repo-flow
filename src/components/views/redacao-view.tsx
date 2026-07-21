import { useState, useEffect, useCallback } from "react";
import {
  PenLine,
  Sparkles,
  Send,
  Loader2,
  Star,
  History,
  FileText,
} from "lucide-react";
import {
  fetchRedacoes,
  insertRedacao,
  updateRedacaoCorrecao,
  type RedacaoRow,
} from "../../lib/db";
import { generateRedacaoTema, corrigirRedacao } from "../../lib/ai.functions";
import { insertLancamento } from "../../lib/db";

export default function RedacaoView() {
  const [tema, setTema] = useState("");
  const [proposta, setProposta] = useState("");
  const [texto, setTexto] = useState("");
  const [redacoes, setRedacoes] = useState<RedacaoRow[]>([]);
  const [loadingTema, setLoadingTema] = useState(false);
  const [corrigindo, setCorrigindo] = useState(false);
  const [correcao, setCorrecao] = useState<RedacaoRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRedacoes();
      setRedacoes(data);
      if (data.length > 0 && !tema) {
        const ultima = data[0];
        setTema(ultima.tema);
        setTexto(ultima.texto);
        if (ultima.nota !== null) setCorrecao(ultima);
      }
    } catch (err) {
      console.error("Erro ao carregar redações:", err);
    } finally {
      setLoading(false);
    }
  }, [tema]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGerarTema = async () => {
    setLoadingTema(true);
    try {
      const result = await generateRedacaoTema();
      setTema(result.tema);
      setProposta(result.proposta ?? "");
      setTexto("");
      setCorrecao(null);
    } catch (err) {
      console.error("Erro ao gerar tema:", err);
      alert("Não foi possível gerar o tema. Tente novamente.");
    } finally {
      setLoadingTema(false);
    }
  };

  const handleCorrigir = async () => {
    if (!texto.trim() || !tema) return;
    setCorrigindo(true);
    try {
      const redacao = await insertRedacao(tema, texto);
      const result = await corrigirRedacao(texto);
      await updateRedacaoCorrecao(redacao.id, result.nota, result.feedback as Record<string, unknown>);

      const corrigida: RedacaoRow = {
        ...redacao,
        nota: result.nota,
        feedback_json: result.feedback as Record<string, unknown>,
      };
      setCorrecao(corrigida);

      // Feed nota into redacao discipline mastery (nota 0-10 → 0-100)
      await insertLancamento({
        disciplina_id: "redacao",
        topico_id: null,
        mastery: result.nota * 10,
        minutos: 30,
        is_primeiro_contato: false,
      });

      await load();
    } catch (err) {
      console.error("Erro ao corrigir:", err);
      alert("Não foi possível corrigir a redação. Tente novamente.");
    } finally {
      setCorrigindo(false);
    }
  };

  const feedbackEntries = correcao?.feedback_json
    ? Object.entries(correcao.feedback_json)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-ink-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <PenLine className="w-6 h-6 text-warning-600" /> Redação
        </h1>
        <p className="text-sm text-ink-500 mt-1">
          Temas gerados por IA com base no edital PMSC Soldado 2026 (banca AOCP).
          Correção por critérios oficiais.
        </p>
      </div>

      {/* Theme section */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
              Tema Atual
            </span>
            {tema ? (
              <h3 className="text-lg font-bold text-ink-900 mt-1">{tema}</h3>
            ) : (
              <p className="text-sm text-ink-400 mt-1">Nenhum tema gerado ainda.</p>
            )}
            {proposta && (
              <p className="text-sm text-ink-500 mt-2">{proposta}</p>
            )}
          </div>
          <button
            onClick={handleGerarTema}
            disabled={loadingTema}
            className="btn-secondary shrink-0"
          >
            {loadingTema ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Gerar novo tema
          </button>
        </div>
      </div>

      {/* Writing area */}
      <div className="card p-5 mb-6">
        <label className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2 block">
          Sua Redação
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua redação dissertativo-argumentativa aqui..."
          className="w-full min-h-[300px] resize-y rounded-xl border border-ink-200 p-4 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-ink-400">
            {texto.length} caracteres
            {texto.length > 0 && ` · ${texto.trim().split(/\s+/).length} palavras`}
          </span>
          <button
            onClick={handleCorrigir}
            disabled={!texto.trim() || corrigindo}
            className="btn-primary"
          >
            {corrigindo ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar para correção
          </button>
        </div>
      </div>

      {/* Correction result */}
      {correcao && correcao.nota !== null && (
        <div className="card p-5 mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
              <Star className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <span className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                Nota
              </span>
              <h3 className="text-2xl font-bold text-ink-900">
                {Number(correcao.nota).toFixed(1)}
                <span className="text-base text-ink-400 font-normal">/10</span>
              </h3>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-ink-700 mb-3">Feedback por critério</h4>
          <div className="space-y-3">
            {feedbackEntries.map(([key, value]) => (
              <div key={key} className="border-l-2 border-brand-200 pl-3">
                <span className="text-xs font-semibold text-brand-700 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <p className="text-sm text-ink-600 mt-0.5">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {redacoes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Histórico de Redações
          </h3>
          <div className="space-y-2">
            {redacoes.map((r) => (
              <div key={r.id} className="card p-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{r.tema}</p>
                  <p className="text-xs text-ink-400">
                    {new Date(r.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {r.nota !== null ? (
                  <span className="text-sm font-bold text-brand-600">
                    {Number(r.nota).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-xs text-ink-400">Sem nota</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
