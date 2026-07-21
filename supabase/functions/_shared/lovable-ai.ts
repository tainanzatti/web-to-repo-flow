/**
 * Shared helper for calling the Lovable AI Gateway.
 * Used by all AI edge functions.
 *
 * Provider: Lovable AI Gateway
 * Endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
 * Model: google/gemini-3-flash-preview
 * Auth: LOVABLE_API_KEY (server-side only)
 */

export const LOVABLE_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const LOVABLE_MODEL = "google/gemini-3-flash-preview";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export interface LovableMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callLovableAI(
  messages: LovableMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<{ content: string; error?: string }> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { content: "", error: "LOVABLE_API_KEY não configurada" };
  }

  const body: Record<string, unknown> = {
    model: LOVABLE_MODEL,
    messages,
    temperature: options?.temperature ?? 0.4,
    max_tokens: options?.maxTokens ?? 2000,
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(LOVABLE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    return { content: "", error: `Erro da API Lovable (${response.status}): ${errText}` };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return { content: "", error: "Resposta vazia da IA" };
  }

  return { content };
}

export function errorResponse(error: string, status = 500) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function successResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

/** Try to extract JSON from a text response that might have markdown fences */
export function extractJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
