import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2, Sparkles, BookOpen, X } from "lucide-react";
import { aiChat, type ChatMessage } from "../../lib/ai.service";
import { fetchDisciplines, fetchAllTopics } from "../../lib/db";
import type { Discipline, Topic } from "../../lib/curriculum";

interface UIMessage extends ChatMessage {
  id: string;
}

export function ChatView() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selDisc, setSelDisc] = useState("");
  const [selTopico, setSelTopico] = useState("");
  const [showContext, setShowContext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDisciplines().then(setDisciplines);
    fetchAllTopics().then(setTopics);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const filteredTopics = topics.filter((t) => t.disciplina_id === selDisc);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: UIMessage = { id: crypto.randomUUID(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const apiMessages: ChatMessage[] = newMessages.map((m) => ({ role: m.role, content: m.content }));
    const disc = disciplines.find((d) => d.id === selDisc)?.nome;
    const top = topics.find((t) => t.id === selTopico)?.nome;

    const { content, error } = await aiChat(apiMessages, { disciplina: disc, topico: top });

    setLoading(false);
    const assistantMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: error ?? content,
    };
    setMessages((prev) => [...prev, assistantMsg]);
  }, [input, loading, messages, disciplines, topics, selDisc, selTopico]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Chat de Estudos
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Tire dúvidas com seu professor IA especialista em PMSC/AOCP.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowContext(!showContext)} className="btn-ghost text-sm">
            <BookOpen className="w-4 h-4" /> Contexto
          </button>
          {messages.length > 0 && (
            <button onClick={clearChat} className="btn-ghost text-sm text-error-600 dark:text-error-400">
              <X className="w-4 h-4" /> Limpar
            </button>
          )}
        </div>
      </div>

      {showContext && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slideUp">
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina (opcional)</label>
            <select value={selDisc} onChange={(e) => { setSelDisc(e.target.value); setSelTopico(""); }} className="input-base border-ink-200 dark:border-ink-700">
              <option value="">Sem contexto específico</option>
              {disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico (opcional)</label>
            <select value={selTopico} onChange={(e) => setSelTopico(e.target.value)} className="input-base border-ink-200 dark:border-ink-700" disabled={!selDisc}>
              <option value="">Sem tópico específico</option>
              {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="card flex-1 flex flex-col overflow-hidden min-h-[400px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 text-brand-300 dark:text-brand-700 mx-auto mb-3" />
              <p className="text-sm text-ink-400">Faça uma pergunta sobre qualquer matéria do edital PMSC 2026.</p>
              <p className="text-xs text-ink-400 mt-1">Ex: "Explique o que é habeas corpus" ou "Como funciona o princípio da legalidade?"</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-ink-50 dark:bg-ink-800 text-ink-800 dark:text-ink-200"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-ink-50 dark:bg-ink-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span className="text-sm text-ink-400">Digitando...</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-ink-100 dark:border-ink-800 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              rows={1}
              className="flex-1 input-base border-ink-200 dark:border-ink-700 resize-none"
              disabled={loading}
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
