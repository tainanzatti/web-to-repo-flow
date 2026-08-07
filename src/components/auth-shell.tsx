import type { ReactNode } from 'react'
import { Shield } from 'lucide-react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Moldura visual compartilhada das telas de autenticação (mesmo tema do app). */
export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <Shield size={19} className="text-primary" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="font-display text-base font-bold tracking-wide text-foreground">
              OPERAÇÃO <span className="text-primary">PMSC</span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.16em] text-faint">SOLDADO 2026</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-soft bg-card p-6 sm:p-7">
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-5 text-center text-[13px]">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-[12px] text-destructive">{message}</p>
}
