import { useState, useEffect, useCallback, type FC } from "react";
import { FileText, Link as LinkIcon, Upload, Trash2, Sparkles, Loader2, ExternalLink, File } from "lucide-react";
import type { Topic, Discipline } from "../../lib/curriculum";
import {
  fetchLeiSeca, insertLeiSecaLink, uploadLeiSecaFile, deleteLeiSeca,
  fetchResumo, insertResumo, fetchLeiSecaContexto,
  type LeiSecaRow,
} from "../../lib/db";
import { gerarResumo } from "../../lib/ai-client";

interface TopicCardProps {
  topic: Topic;
  discipline: Discipline;
}

type Tab = "lei-seca" | "resumo";

export const TopicCard: FC<TopicCardProps> = ({ topic, discipline }) => {
  const [tab, setTab] = useState<Tab>("lei-seca");
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

  useEffect(() => {
    loadLeiSeca();
    loadResumo();
  }, [loadLeiSeca, loadResumo]);

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    setErro(null);
    await insertLeiSecaLink(topic.id, linkTitle.trim(), linkUrl.trim());
    setLinkTitle("");
    setLinkUrl("");
    await loadLeiSeca();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro(null);
    try {
      await uploadLeiSecaFile(topic.id, file);
      await loadLeiSeca();
    } catch (err) {
      setErro((err as Error).message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await deleteLeiSeca(id);
    await loadLeiSeca();
  };

  const handleGerarResumo = async () => {
    setGerando(true);
    setErro(null);
    const contexto = await fetchLeiSecaContexto(topic.id);
    const { resumo: texto, error } = await gerarResumo(topic.nome, discipline.nome, contexto);
    if (error || !texto) {
      setErro(error ?? "Erro ao gerar resumo");
      setGerando(false);
      return;
    }
    await insertResumo(discipline.id, topic.id, texto);
    setResumo(texto);
    setGerando(false);
  };

  return (
    <div className="card p-4 animate-slideUp">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-ink-900">{topic.nome}</h4>
        <div className="flex gap-1">
          <button
            onClick={() => setTab("lei-seca")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === "lei-seca" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Lei Seca
          </button>
          <button
            onClick={() => setTab("resumo")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === "resumo" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Resumo IA
          </button>
        </div>
      </div>

      {tab === "lei-seca" && (
        <div className="space-y-3">
          {loadingLeiSeca ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            </div>
          ) : (
            <>
              {leiSeca.length > 0 && (
                <div className="space-y-2">
                  {leiSeca.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-50 group">
                      {item.tipo === "link" ? (
                        <LinkIcon className="w-4 h-4 text-brand-600 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-success-600 shrink-0" />
                      )}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-ink-700 hover:text-brand-600 truncate flex-1"
                      >
                        {item.titulo}
                      </a>
                      <ExternalLink className="w-3 h-3 text-ink-300 shrink-0" />
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-error-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Título"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={handleAddLink}
                  disabled={!linkTitle.trim() || !linkUrl.trim()}
                  className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                >
                  <LinkIcon className="w-3 h-3" /> Add
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-lg py-3 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                ) : (
                  <Upload className="w-4 h-4 text-ink-400" />
                )}
                <span className="text-xs text-ink-500">
                  {uploading ? "Enviando..." : "Anexar arquivo (PDF, imagem...)"}
                </span>
                <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            </>
          )}
        </div>
      )}

      {tab === "resumo" && (
        <div className="space-y-3">
          {loadingResumo ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            </div>
          ) : resumo ? (
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{resumo}</div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-ink-400 mb-3">
                Nenhum resumo gerado ainda. A IA criará um resumo baseado no tópico e nos materiais da Lei Seca.
              </p>
            </div>
          )}
          {erro && (
            <p className="text-xs text-error-600">{erro}</p>
          )}
          <button
            onClick={handleGerarResumo}
            disabled={gerando}
            className="btn-primary w-full text-xs"
          >
            {gerando ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> {resumo ? "Regenerar resumo" : "Gerar resumo com IA"}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
