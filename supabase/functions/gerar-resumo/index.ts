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
      return new Response(
        JSON.stringify({ error: "topico_nome e disciplina_nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um professor especialista em concursos públicos brasileiros, focado no concurso de Soldado da Polícia Militar de Santa Catarina (PMSC), banca AOCP.`;

    const contextoAdicional = lei_seca_contexto
      ? `\n\nO estudante anexou o seguinte material de apoio (Lei Seca):\n${lei_seca_contexto}\n\nUse este material como referência prioritária ao gerar o resumo.`
      : "";

    const userPrompt = `Gere um resumo de estudo detalhado e estruturado sobre o tópico "${topico_nome}" da disciplina "${disciplina_nome}" para o concurso Soldado PMSC (banca AOCP).

O resumo deve:
1. Ser escrito em português brasileiro
2. Ter no máximo 800 palavras
3. Ser estruturado em seções com títulos claros
4. Incluir os pontos mais cobrados em provas
5. Destacar palavras-chave e conceitos importantes
6. Ser objetivo e focado na memorização
7. Usar linguagem simples e direta

${contextoAdicional}

Retorne APENAS o texto do resumo, sem marcadores de código ou metadados.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Erro na API Gemini: ${geminiRes.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const resumo = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resumo) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da API Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ resumo: resumo.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
