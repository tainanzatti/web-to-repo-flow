import { Crown, RotateCcw, Loader2, Check, Moon, Sun, Monitor, CalendarDays, Clock, Target, ClipboardList, ChevronDown } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'
import { useAuth } from '@/lib/auth-context'
import { useTheme, type ThemeMode } from '@/lib/theme-context'
import { supabase } from '@/lib/supabase'

type Props = {
  lancamentos: Lancamento[]
  onReset: () => void
}

// Data prevista da prova (PMSC Soldado 2026).
const EXAM_DATE = '2026-07-09'

function PerfilViewInner({ lancamentos, onReset }: Props) {
  const { user, profile } = useAuth()
  const { theme, setTheme } = useTheme()

  const stats = useMemo(() => {
    const totalQ = lancamentos.reduce((a, e) => a + e.quantidade, 0)
    const totalA = lancamentos.reduce((a, e) => a + e.acertos, 0)
    const minutos = lancamentos.reduce((a, e) => a + e.minutos, 0)
    const dias = new Set(lancamentos.map((l) => l.data)).size
    const hoje = new Date().toISOString().slice(0, 10)
    const diasProva = Math.max(
      0,
      Math.round((new Date(EXAM_DATE).getTime() - new Date(hoje).getTime()) / 86400000),
    )
    return {
      totalQ,
      dias,
      horas: (minutos / 60).toFixed(1),
      aproveitamento: totalQ > 0 ? Math.round((totalA / totalQ) * 100) : null,
      diasProva,
    }
  }, [lancamentos])

  const [showCadastro, setShowCadastro] = useState(false)
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name || '')
    setCpf(profile.cpf || '')
    setDateOfBirth(profile.date_of_birth || '')
    setPhone(((profile as unknown as { phone?: string }).phone) || '')
  }, [profile])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          cpf: cpf || null,
          date_of_birth: dateOfBirth || null,
          phone: phone || null,
        } as never)
        .eq('id', user.id)
      if (error) throw error
      setSaved(true)
      toast.success('Perfil atualizado.')
      savedTimer.current = setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      toast.error('Não foi possível salvar seu perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Identidade do candidato */}
      <div className="rounded-2xl border border-primary/30 bg-card p-5">
        <SectionLabel>CANDIDATO</SectionLabel>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-display text-base font-bold text-primary">
            {(fullName || user?.email || '??').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold text-foreground">
              {fullName || user?.email}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Concurso: <strong className="text-foreground">PMSC Soldado 2026</strong> · Banca:{' '}
              <strong className="text-foreground">Instituto AOCP</strong>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-tier-mastered/40 bg-tier-mastered/10 px-3 py-2">
            <Crown size={14} className="text-tier-good" />
            <span className="font-display text-xs font-bold text-foreground">Premium ativo</span>
          </div>
        </div>
      </div>

      {/* Números do concurso */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={CalendarDays} label="Dias até a prova" value={String(stats.diasProva)} />
        <Stat icon={Clock} label="Horas estudadas" value={`${stats.horas}h`} />
        <Stat icon={ClipboardList} label="Questões feitas" value={String(stats.totalQ)} />
        <Stat
          icon={Target}
          label="Aproveitamento geral"
          value={stats.aproveitamento === null ? '—' : `${stats.aproveitamento}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel>ASSINATURA</SectionLabel>
          <InfoRow label="Status" value="Ativa" valueColor="var(--success)" />
          <InfoRow label="Tipo" value="Operação PMSC — Premium" />
          <InfoRow label="Expiração" value="09/07/2026" />
        </div>
        <div className="rounded-2xl border border-border-soft bg-card p-5">
          <SectionLabel>ROTINA</SectionLabel>
          <InfoRow label="Dias ativos" value={String(stats.dias)} />
          <InfoRow label="Plano" value="[PMSC] Soldado 2026" />
          <InfoRow label="Data da prova" value="09/07/2026" />
        </div>
      </div>

      {/* Dados cadastrais — seção secundária */}
      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <button
          onClick={() => setShowCadastro((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <SectionLabel>DADOS CADASTRAIS</SectionLabel>
          <ChevronDown
            size={16}
            className={`mb-2 text-faint transition-transform ${showCadastro ? 'rotate-180' : ''}`}
          />
        </button>
        {showCadastro && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome completo" value={fullName} onChange={setFullName} />
              <Field label="Email" value={user?.email || ''} onChange={() => {}} disabled />
              <Field label="CPF" value={cpf} onChange={setCpf} />
              <Field
                label="Data de nascimento"
                value={dateOfBirth}
                onChange={setDateOfBirth}
                type="date"
              />
              <Field label="Celular" value={phone} onChange={setPhone} />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {saved && (
                <span className="flex items-center gap-1 text-xs text-[color:var(--success)]">
                  <Check size={14} /> Salvo
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-display text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>APARÊNCIA</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Escolha o tema da plataforma. A opção Automático segue a preferência do seu sistema
            operacional. Sua escolha é salva na sua conta.
          </p>
          <div className="flex gap-2">
            {([
              { id: 'light', label: 'Claro', Icon: Sun },
              { id: 'dark', label: 'Escuro', Icon: Moon },
              { id: 'auto', label: 'Auto', Icon: Monitor },
            ] as { id: ThemeMode; label: string; Icon: typeof Sun }[]).map(({ id, label, Icon }) => {
              const active = theme === id
              return (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border-soft bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-5">
        <SectionLabel>DADOS DO APLICATIVO</SectionLabel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-md text-[12px] leading-relaxed text-muted-foreground">
            Todo o seu histórico de estudos fica salvo na sua conta. Reiniciar apaga permanentemente
            todos os seus lançamentos — a conta volta ao estado inicial (zero questões, zero
            progresso).
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

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-4">
      <div className="flex items-center gap-2 text-faint">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-foreground">{value}</div>
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

function Field({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="input-base disabled:opacity-60"
      />
    </div>
  )
}

export const PerfilView = memo(PerfilViewInner)
