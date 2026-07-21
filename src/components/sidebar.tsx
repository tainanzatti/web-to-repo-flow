import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Target,
  Layers,
  BarChart3,
  PenLine,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Timer,
} from 'lucide-react'
import { fetchUserPrefs, upsertUserPrefs, fetchFlashcards } from '../lib/db'

export type ViewKey =
  | 'painel'
  | 'nucleo'
  | 'flashcards'
  | 'desempenho'
  | 'comparativo'
  | 'redacao'
  | 'perfil'
  | 'foco'

type NavItem = {
  key: ViewKey
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { key: 'painel', label: 'Painel', icon: LayoutDashboard },
  { key: 'nucleo', label: 'Núcleo', icon: Target },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'desempenho', label: 'Desempenho', icon: BarChart3 },
  { key: 'comparativo', label: 'Comparativo', icon: BarChart3 },
  { key: 'redacao', label: 'Redação', icon: PenLine },
  { key: 'foco', label: 'Modo Foco', icon: Timer },
  { key: 'perfil', label: 'Perfil', icon: User },
]

type Props = {
  current: ViewKey
  onNavigate: (v: ViewKey) => void
}

export default function Sidebar({ current, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [pendingFlashcards, setPendingFlashcards] = useState(0)

  useEffect(() => {
    fetchUserPrefs().then((prefs) => {
      if (prefs) setExpanded(prefs.sidebar_expandida)
    })
  }, [])

  useEffect(() => {
    fetchFlashcards().then((cards) => {
      const today = new Date().toISOString().slice(0, 10)
      setPendingFlashcards(cards.filter((c) => c.proxima_revisao <= today).length)
    })
  }, [current])

  function toggle() {
    const next = !expanded
    setExpanded(next)
    upsertUserPrefs({ sidebar_expandida: next }).catch(() => {})
  }

  return (
    <aside
      style={{
        width: expanded ? 220 : 64,
        transition: 'width 200ms cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div
        style={{
          padding: expanded ? '20px 20px 12px' : '20px 0 12px',
          display: 'flex',
          justifyContent: expanded ? 'space-between' : 'center',
          alignItems: 'center',
        }}
      >
        {expanded && (
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
            Operação PMSC
          </span>
        )}
        <button
          onClick={toggle}
          title={expanded ? 'Recolher' : 'Expandir'}
          style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}
        >
          {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
      <nav style={{ flex: 1, padding: expanded ? '8px 12px' : '8px 0' }}>
        {NAV_ITEMS.map((item) => {
          const active = current === item.key
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={expanded ? undefined : item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? 12 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
                width: '100%',
                padding: expanded ? '10px 12px' : '10px 0',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active ? 'var(--primary-light)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                transition: 'all 150ms ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-card-hover)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {expanded && <span>{item.label}</span>}
              {item.key === 'flashcards' && pendingFlashcards > 0 && (
                <span
                  className="badge badge-error"
                  style={{
                    position: expanded ? 'static' : 'absolute',
                    top: expanded ? 'auto' : 4,
                    right: expanded ? 'auto' : 4,
                    marginLeft: expanded ? 'auto' : 0,
                    fontSize: 11,
                    padding: '2px 7px',
                  }}
                >
                  {pendingFlashcards}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      {expanded && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          PMSC Soldado 2026 · AOCP
        </div>
      )}
    </aside>
  )
}
