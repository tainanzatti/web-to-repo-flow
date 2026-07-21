import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topicos } = await req.json();

    if (!topicos || !Array.isArray(topicos) || topicos.length === 0) {
      return new Response(JSON.stringify({ error: "Tópicos são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const topicosStr = topicos.map((t: any, i: number) => `${i + 1}. ${t.disciplina_nome} - ${t.topico_nome} | Domínio: ${t.mastery.toFixed(0)}% | Revisões: ${t.revisoes} | Dias desde última: ${t.dias_desde_ultima} | Questões: ${t.questoes} | Acertos: ${t.taxa_acertos.toFixed(0)}% | Erros: ${t.taxa_erros.toFixed(0)}% | Peso edital: ${t.peso_edital}`).join("\n");

    const prompt = `Você é um especialista em concursos públicos para a Polícia Militar de Santa Catarina (PMSC). Com base nos dados de estudo do candidato abaixo, crie um plano de estudos para hoje com no máximo 60 minutos.

Dados dos tópicos (ordenados por prioridade):
${topicosStr}

Regras:
- Selecione os tópicos mais prioritários (baixo domínio, alto esquecimento, muitos erros, peso alto no edital)
- Distribua o tempo total de 60 minutos entre os tópicos selecionados
- Atribua uma prioridade: "Alta", "Média" ou "Baixa"
- Para cada tópico, explique brevemente o motivo da priorização

Retorne APENAS um JSON válido no formato:
{"itens": [{"topico_id": "...", "topico_nome": "...", "disciplina_nome": "...", "tempo_minutos": 30, "prioridade": "Alta", "motivo": "..."}], "tempo_total": 60}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500, responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Erro da API Gemini: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!raw) {
      return new Response(JSON.stringify({ error: "Não foi possível gerar o plano" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let plano;
    try { plano = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { plano = JSON.parse(m[0]); } catch {} }
    }

    if (!plano || !plano.itens) {
      return new Response(JSON.stringify({ error: "Resposta da IA em formato inválido" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ plano }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
