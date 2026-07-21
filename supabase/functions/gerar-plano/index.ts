const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TopicoInput {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topicos } = await req.json() as { topicos: TopicoInput[] };

    if (!topicos || !Array.isArray(topicos) || topicos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Lista de tópicos é obrigatória" }),
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

    const systemPrompt = `Você é um sistema de planejamento adaptativo de estudos para concursos públicos, especializado no concurso Soldado PMSC (banca AOCP). Você cria planos de estudo diários personalizados baseados em repetição espaçada e análise de desempenho.`;

    const topicosStr = topicos.map((t, i) =>
      `${i + 1}. Tópico: "${t.topico_nome}" (Disciplina: ${t.disciplina_nome})
   - Domínio (mastery): ${t.mastery.toFixed(0)}%
   - Revisões feitas: ${t.revisoes}
   - Dias desde última revisão: ${t.dias_desde_ultima}
   - Questões respondidas: ${t.questoes}
   - Acertos: ${t.acertos} (${t.taxa_acertos.toFixed(0)}%)
   - Erros: ${t.taxa_erros.toFixed(0)}%
   - Peso no edital: ${t.peso_edital}`
    ).join("\n\n");

    const userPrompt = `Com base nos dados de desempenho abaixo, crie um plano de estudo para HOJE com no máximo 60 minutos totais.

TÓPICOS DISPONÍVEIS:
${topicosStr}

REGRAS:
1. O tempo total NUNCA deve ultrapassar 60 minutos.
2. Se o usuário tem baixo domínio em um tópico importante (peso alto), priorize-o com mais tempo.
3. Se o usuário nunca estudou um tópico (0 revisões), comece com apenas 1 tópico por sessão.
4. Após 3-4 revisões com bom desempenho (taxa de acertos > 70%), pode incluir mais tópicos.
5. Se o desempenho piorou (alta taxa de erros), reduza a quantidade de tópicos e foque nos com mais erros.
6. Tópicos com peso alto no edital devem aparecer com mais frequência.
7. Tópicos não revisados há mais de 7 dias devem ser priorizados para revisão.
8. Para cada tópico, defina: prioridade (Alta, Média, Baixa) e um motivo curto explicando a recomendação.

Retorne APENAS um JSON válido no formato:
{
  "itens": [
    {
      "topico_id": "id_do_topico",
      "topico_nome": "nome",
      "disciplina_nome": "nome_disciplina",
      "tempo_minutos": 30,
      "prioridade": "Alta",
      "motivo": "Este tópico apareceu porque seu índice de acertos foi de apenas 58%."
    }
  ],
  "tempo_total": 60
}

Não inclua markdown, apenas o JSON.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }, { text: userPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
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
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da API Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let jsonStr = rawText.trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    let plano;
    try {
      plano = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "Falha ao parsear resposta da IA", raw: rawText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (plano.tempo_total > 60) {
      const ratio = 60 / plano.tempo_total;
      plano.itens.forEach((i: { tempo_minutos: number }) => {
        i.tempo_minutos = Math.max(10, Math.round(i.tempo_minutos * ratio));
      });
      plano.tempo_total = plano.itens.reduce((a: number, b: { tempo_minutos: number }) => a + b.tempo_minutos, 0);
    }

    return new Response(
      JSON.stringify({ plano }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
