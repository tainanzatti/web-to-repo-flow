/**
 * Traduz erros de autenticação do backend em mensagens claras em português.
 * Cobre também falhas de rede (o genérico "Failed to fetch").
 */
export function authErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'Erro inesperado'

  const msg = raw.toLowerCase()

  // Falha de rede / CORS / offline
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  ) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'Você está sem conexão com a internet. Reconecte e tente novamente.'
    }
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente em alguns instantes.'
  }

  if (msg.includes('invalid login credentials')) return 'Email ou senha incorretos.'
  if (msg.includes('email not confirmed')) return 'Confirme seu email antes de entrar.'
  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return 'Este email já está cadastrado. Faça login ou recupere sua senha.'
  if (msg.includes('weak password') || msg.includes('known to be weak'))
    return 'Senha muito fraca ou vazada. Escolha uma senha mais forte (letras, números e símbolos).'
  if (msg.includes('password should be at least'))
    return 'A senha precisa ter ao menos 6 caracteres.'
  if (msg.includes('unable to validate email') || msg.includes('invalid email'))
    return 'Email inválido.'
  if (msg.includes('email rate limit') || msg.includes('over_email_send_rate_limit'))
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return 'Muitas tentativas. Aguarde um instante antes de tentar de novo.'
  if (msg.includes('signups not allowed') || msg.includes('signup is disabled'))
    return 'Os cadastros estão temporariamente desativados.'
  if (msg.includes('same password'))
    return 'A nova senha precisa ser diferente da anterior.'
  if (msg.includes('auth session missing') || msg.includes('session_not_found'))
    return 'Sua sessão expirou. Faça login novamente.'
  if (msg.includes('token has expired') || msg.includes('invalid or expired'))
    return 'O link expirou. Solicite um novo email de recuperação.'

  return raw
}

export class AuthError extends Error {
  constructor(err: unknown) {
    super(authErrorMessage(err))
    this.name = 'AuthError'
  }
}
