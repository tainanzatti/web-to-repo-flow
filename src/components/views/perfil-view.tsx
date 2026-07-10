import { Crown, RotateCcw } from 'lucide-react'
import { type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'

type Props = {
  lancamentos: Lancamento[]
  onReset: () => void
}

export function PerfilView({ lancamentos, onReset }: Props) {
  const totalQ = lancamentos.reduce((a, e) => a + e.quantidade, 0)
  const dias = new Set(lancamentos.map((l) => l.data)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel>ASSINATURA</SectionLabel>
          <InfoRow label="Status" value="Ativa" valueColor="var(--success)" />
          <InfoRow label="Tipo" value="Operação PMSC — Premium" />
          <InfoRow label="Expiração" value="09/07/2026" />
        </div>
        <div className="rounded-2xl border border-primary/30 bg-card p-5">
          <SectionLabel>PLANO SELECIONADO</SectionLabel>
          <div className="flex items-center gap-2 rounded-lg border border-tier-mastered/40 bg-tier-mastered/10 px-3 py-3">
            <Crown size={16} className="text-tier-good" />
            <span className="font-display text-sm font-bold text-foreground">
              [PMSC] Soldado 2026
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniStat label="Questões resolvidas" value={totalQ} />
            <MiniStat label="Dias ativos" value={dias} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>INFORMAÇÕES PESSOAIS</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" defaultValue="Tainan" />
          <Field label="Sobrenome" defaultValue="Zatti" />
          <Field label="CPF" defaultValue="063.842.079-23" />
          <Field label="Email" defaultValue="tainan@exemplo.com" />
          <Field label="Data de nascimento" defaultValue="19/07/1994" />
          <Field label="Celular" defaultValue="(48) 99132-0999" />
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110">
            Salvar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>DADOS DO APLICATIVO</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Todo o seu histórico de estudos fica salvo neste dispositivo. Reiniciar volta ao estado
            inicial (apenas o lançamento de demonstração permanece).
          </p>
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-primary/50 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <RotateCcw size={14} /> Reiniciar dados
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft/60 py-2.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-faint">{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor || 'var(--foreground)' }}>
        {value}
      </span>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-soft bg-secondary p-3">
      <div className="font-mono text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-faint">{label}</div>
    </div>
  )
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      <input defaultValue={defaultValue} className="input-base" />
    </div>
  )
}
