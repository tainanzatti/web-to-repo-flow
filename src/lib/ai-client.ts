import { supabase } from "./supabase";

export async function gerarResumo(
  topicoNome: string, disciplinaNome: string, leiSecaContexto?: string
): Promise<{ resumo?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-resumo`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ topico_nome: topicoNome, disciplina_nome: disciplinaNome, lei_seca_contexto: leiSecaContexto }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { error: errBody.error ?? `Erro ${res.status}` };
    }
    const json = await res.json();
    if (json.error) return { error: json.error };
    return { resumo: json.resumo };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export interface PlanoAIInput {
  topico_id: string;
  topico_nome: string;
  disciplina_nome: string;
  mastery: number;
  revisoes: number;
  dias_desde_ultima: number;
  questoes: number;
  acertos: number;
  taxa_acertos: number;
  taxa_erros: number;
  peso_edital: number;
}

export async function gerarPlanoAI(
  topicos: PlanoAIInput[]
): Promise<{ plano?: { itens: { topico_id: string; topico_nome: string; disciplina_nome: string; tempo_minutos: number; prioridade: string; motivo: string }[]; tempo_total: number }; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-plano`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      },
      body: JSON.stringify({ topicos }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { error: errBody.error ?? `Erro ${res.status}` };
    }
    const json = await res.json();
    if (json.error) return { error: json.error };
    return { plano: json.plano };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
