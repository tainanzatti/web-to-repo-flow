import { useEffect, useState } from 'react'

/**
 * Retorna true apenas depois da hidratação no cliente.
 * Usado para impedir submit nativo (GET) de formulários antes do React assumir,
 * o que jogava email/senha na URL e fazia o login "falhar".
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
