import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Loader2, Trash2, Bot } from "lucide-react";
import { aiChat, type ChatMessage } from "../../lib/ai.service";

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ disciplina: "", topico: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const resposta = await aiChat([...messages, userMsg], context);
      setMessages((m) => [...m, { role: "assistant", content: resposta }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Erro: ${(err as Error).message}` }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><MessageSquare className="w-7 h-7 text-brand-600" />Chat IA</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Converse com o professor virtual especialista em PMSC.</p></div>
        {messages.length > 0 && <button onClick={() => setMessages([])} className="btn-ghost flex items-center gap-1 text-xs"><Trash2 className="w-3.5 h-3.5" />Limpar</button>}
      </div>

      <div className="flex gap-2">
        <input type="text" value={context.disciplina} onChange={(e) => setContext({ ...context, disciplina: e.target.value })} className="input-base text-xs" placeholder="Disciplina (opcional)" />
        <input type="text" value={context.topico} onChange={(e) => setContext({ ...context, topico: e.target.value })} className="input-base text-xs" placeholder="Tópico (opcional)" />
      </div>

      <div ref={scrollRef} className="card p-4 flex-1 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center"><Bot className="w-12 h-12 text-brand-300 dark:text-brand-700 mb-3" /><p className="text-sm text-ink-400">Envie uma mensagem para começar a conversar com o professor virtual.</p></div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === "user" ? "bg-brand-600 text-white rounded-br-sm" : "bg-ink-100 dark:bg-ink-800 text-ink-800 dark:text-ink-200 rounded-bl-sm"}`}>{m.content}</div>
            </div>
          ))
        )}
        {loading && <div className="flex justify-start"><div className="bg-ink-100 dark:bg-ink-800 p-3 rounded-2xl rounded-bl-sm"><Loader2 className="w-4 h-4 animate-spin text-ink-400" /></div></div>}
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="input-base flex-1" placeholder="Digite sua mensagem..." />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary flex items-center gap-2 shrink-0"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
