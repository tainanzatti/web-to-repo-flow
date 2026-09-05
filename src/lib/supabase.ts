import { createClient } from '@supabase/supabase-js'

import { brokeredPreviewStorage } from '@/integrations/supabase/previewAuthStorage'
import type { Database } from '@/integrations/supabase/types'

// Valores públicos do projeto. Os fallbacks garantem que builds publicados
// continuem conectados mesmo quando o ambiente de build não injeta VITE_*.
const BACKEND_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  'https://bqptewqwmbmcpdwimhkm.supabase.co'

const PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  'sb_publishable_PhiOFTpKiebq0N1eqFysIA_q8nKkX8Z'

function cloudFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(input instanceof Request ? input.headers : undefined)
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value))

  // Chaves públicas modernas são opacas e devem ser enviadas como apikey.
  if (headers.get('Authorization') === `Bearer ${PUBLISHABLE_KEY}`) {
    headers.delete('Authorization')
  }
  headers.set('apikey', PUBLISHABLE_KEY)

  return fetch(input, { ...init, headers })
}

export const supabase = createClient<Database>(BACKEND_URL, PUBLISHABLE_KEY, {
  global: { fetch: cloudFetch },
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
})
