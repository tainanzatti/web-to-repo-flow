import { useEffect, useState, useCallback } from "react";
import { PenTool, Loader2, Sparkles, FileText, Award } from "lucide-react";
import { fetchRedacoes, insertRedacao, updateRedacaoCorrecao, type RedacaoRow } from "../../lib/db";
import { generateRedacaoTema, corrigirRedacao } from "../../lib/ai.functions";

export function RedacaoView() {
  const [redacoes, setRedacoes] = useState<RedacaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [gerandoTema, setGerandoTema] = useState(false);
  const [corrigindo, setCorrigindo] = useState(false);
  const [nota, setNota] = useState<number | null>(null);
  const [correcao, setCorrecao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchRedacoes();
    setRedacoes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGerarTema = async () => {
    setGerandoTema(true);
    setErro(null);
    const t = await generateRedacaoTema();
    setTema(t);
    setGerandoTema(false);
  };

  const handleCorrigir = async () => {
    if (!tema || !texto.trim()) return;
    setCorrigindo(true);
    setErro(null);
    const row = await insertRedacao(tema, texto);
    const result = await corrigirRedacao(tema, texto);
    if (result) {
      await updateRedacaoCorrecao(row.id, result.nota, result.correcao);
      setNota(result.nota);
      setCorrecao(result.correcao);
    } else {
      setErro("Não foi possível corrigir a redação no momento.");
    }
    setCorrigindo(false);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Redação</h1>
        <p className="text-sm text-ink-500 mt-1">Gere temas e corrija suas redações com IA.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-ink-700 mb-1 block">Tema</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Digite ou gere um tema..."
              className="flex-1 rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button onClick={handleGerarTema} disabled={gerandoTema} className="btn-secondary whitespace-nowrap">
              {gerandoTema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar tema
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 mb-1 block">Sua redação</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua redação aqui..."
            rows={12}
            className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          />
          <p className="text-xs text-ink-400 mt-1">{texto.length} caracteres</p>
        </div>

        <button onClick={handleCorrigir} disabled={corrigindo || !tema || !texto.trim()} className="btn-primary">
          {corrigindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
          Corrigir redação
        </button>

        {erro && (
          <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">{erro}</div>
        )}

        {nota !== null && correcao && (
          <div className="rounded-xl bg-success-50 p-5 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-success-600" />
              <span className="text-lg font-bold text-success-700">Nota: {nota.toFixed(1)}/10</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-600 mb-1">Correção:</p>
              <p className="text-sm text-ink-700 whitespace-pre-wrap">{correcao}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Redações anteriores
        </h3>
        <div className="space-y-2">
          {redacoes.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-ink-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 truncate">{r.tema}</p>
                <p className="text-xs text-ink-400">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              {r.nota !== null && (
                <span className="text-sm font-bold text-success-600">{r.nota.toFixed(1)}</span>
              )}
            </div>
          ))}
          {redacoes.length === 0 && (
            <p className="text-sm text-ink-400 text-center py-4">Nenhuma redação registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
