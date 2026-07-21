import { useEffect, useState } from 'react'
import { User, Mail, Phone, Calendar, CreditCard, Save } from 'lucide-react'
import {
  fetchProfile,
  upsertProfile,
  fetchLancamentos,
  fetchQuestaoLancamentos,
  fetchStudyTimeDaily,
} from '../../lib/db'
import type { Profile, Lancamento, QuestaoLancamento, StudyTimeDaily } from '../../lib/types'

const PROVA_DATE = new Date('2026-12-06')

export default function PerfilView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [questoes, setQuestoes] = useState<QuestaoLancamento[]>([])
  const [studyTime, setStudyTime] = useState<StudyTimeDaily[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [cpf, setCpf] = useState('')

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchLancamentos(),
      fetchQuestaoLancamentos(),
      fetchStudyTimeDaily(),
    ]).then(([p, l, q, st]) => {
      setProfile(p)
      setLancamentos(l)
      setQuestoes(q)
      setStudyTime(st)
      setNome(p?.nome ?? '')
      setEmail(p?.email ?? '')
      setTelefone(p?.telefone ?? '')
      setDataNasc(p?.data_nascimento ?? '')
      setCpf(p?.cpf ?? '')
      setLoading(false)
    })
  }, [])

  const totalHours = studyTime.reduce((s, d) => s + d.tempo_segundos, 0) / 3600
  const totalQuestoes = questoes.reduce((s, q) => s + q.quantidade, 0)
  const totalAcertos = questoes.reduce((s, q) => s + q.acertos, 0)
  const apr = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0
  const diasProva = Math.max(
    0,
    Math.ceil((PROVA_DATE.getTime() - Date.now()) / 86400000),
  )

  async function handleSave() {
    setSaving(true)
    try {
      await upsertProfile({
        nome,
        email,
        telefone,
        data_nascimento: dataNasc || null,
        cpf,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading-spinner">Carregando perfil...</div>
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Perfil</h1>
        <p className="view-subtitle">
          Dados relevantes ao concurso e informações cadastrais.
        </p>
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}
      >
        <StatBox label="Concurso" value="PMSC Soldado 2026" />
        <StatBox label="Banca" value="Instituto AOCP" />
        <StatBox label="Dias até a prova" value={String(diasProva)} highlight />
        <StatBox label="Horas estudadas" value={totalHours.toFixed(0) + 'h'} />
        <StatBox label="Questões feitas" value={String(totalQuestoes)} />
        <StatBox label="Aproveitamento" value={apr + '%'} />
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          Dados cadastrais
        </h3>
        <div
          className="grid"
          style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          <Field icon={User} label="Nome" value={nome} onChange={setNome} />
          <Field icon={Mail} label="Email" value={email} onChange={setEmail} />
          <Field icon={Phone} label="Telefone" value={telefone} onChange={setTelefone} />
          <Field
            icon={Calendar}
            label="Data de nascimento"
            value={dataNasc}
            onChange={setDataNasc}
            type="date"
          />
          <Field icon={CreditCard} label="CPF" value={cpf} onChange={setCpf} />
        </div>
        <button
          className="btn btn-primary"
          disabled={saving}
          onClick={handleSave}
          style={{ marginTop: 20 }}
        >
          {saving ? <Save size={16} className="spin" /> : <Save size={16} />}
          Salvar
        </button>
      </div>
    </div>
  )
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        borderColor: highlight ? 'var(--primary)' : 'var(--border)',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Icon size={14} color="var(--text-muted)" />
        {label}
      </label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: 14,
          outline: 'none',
        }}
      />
    </div>
  )
}
