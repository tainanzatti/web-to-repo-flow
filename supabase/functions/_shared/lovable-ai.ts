// Shared helper for Lovable AI Gateway calls from edge functions

export const LOVABLE_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const LOVABLE_MODEL = "google/gemini-3-flash-preview";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function optionsResponse(): Response {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function successResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function callLovableAI(
  messages: { role: string; content: string }[],
  options: { jsonMode?: boolean; temperature?: number } = {},
): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const body: Record<string, unknown> = {
    model: LOVABLE_MODEL,
    messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(LOVABLE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Lovable AI Gateway error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia do Lovable AI Gateway");
  return content as string;
}

export function extractJSON<T>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try extracting from markdown code block
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        // continue
      }
    }
    // Try finding first { and last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    }
    throw new Error("Não foi possível extrair JSON da resposta");
  }
}
