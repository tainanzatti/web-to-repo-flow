import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, X } from 'lucide-react'

type Props = {
  onExit: () => void
}

export default function FocoView({ onExit }: Props) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          color: 'var(--text-muted)',
          padding: 8,
        }}
      >
        <X size={24} />
      </button>

      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 32,
        }}
      >
        Modo Foco
      </div>

      <div
        style={{
          fontSize: 80,
          fontWeight: 200,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          marginBottom: 48,
        }}
      >
        {timeStr}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button
          className="btn btn-primary"
          onClick={() => setRunning(!running)}
          style={{ padding: '14px 28px', fontSize: 16 }}
        >
          {running ? <Pause size={20} /> : <Play size={20} />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setSeconds(0)
            setRunning(false)
          }}
          style={{ padding: '14px 28px', fontSize: 16 }}
        >
          <RotateCcw size={20} />
          Zerar
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}
      >
        Sem distrações. Foco total no estudo.
      </div>
    </div>
  )
}
