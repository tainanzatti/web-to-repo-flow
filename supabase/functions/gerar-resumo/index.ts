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
    const { topico_nome, disciplina_nome, lei_seca_contexto } = await req.json();

    if (!topico_nome || !disciplina_nome) {
      return new Response(JSON.stringify({ error: "Tópico e disciplina são obrigatórios" }), {
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

    const ctx = lei_seca_contexto ? `\n\nMateriais de lei seca fornecidos pelo candidato:\n${lei_seca_contexto}` : "";

    const prompt = `Você é um especialista em concursos públicos para a Polícia Militar de Santa Catarina (PMSC). Crie um resumo de estudo claro, objetivo e bem estruturado sobre o tópico "${topico_nome}" da disciplina "${disciplina_nome}".

O resumo deve:
- Ter no máximo 800 palavras
- Usar linguagem clara e direta
- Destacar os pontos mais importantes para prova
- Usar formatação em tópicos quando relevante
- Focar no que cai em provas da AOCP
- Ser em português brasileiro${ctx}

Retorne APENAS o resumo, sem comentários adicionais.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
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
    const resumo = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!resumo) {
      return new Response(JSON.stringify({ error: "Não foi possível gerar o resumo" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ resumo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
