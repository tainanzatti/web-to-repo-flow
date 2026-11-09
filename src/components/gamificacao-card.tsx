import { useEffect, useMemo, useState } from 'react'
import { Flame, Medal, Target } from 'lucide-react'
import type { Lancamento } from '@/lib/curriculum'
import { META_PADRAO, calcularSequencia, calcularXP, patenteAtual, questoesHoje } from '@/lib/gamificacao'
import { loadJSON, saveJSON } from '@/lib/storage'

export function GamificacaoCard({ lancamentos }: { lancamentos: Lancamento[] }) {
  const [meta, setMeta] = useState(META_PADRAO)
  useEffect(() => setMeta(loadJSON('meta-diaria', META_PADRAO)), [])
  const mudarMeta = (v: number) => { const n = Math.max(5, Math.min(500, v)); setMeta(n); saveJSON('meta-diaria', n) }

  const seq = useMemo(() => calcularSequencia(lancamentos), [lancamentos])
  const xp = useMemo(() => calcularXP(lancamentos), [lancamentos])
  const pat = patenteAtual(xp)
  const feitas = questoesHoje(lancamentos)
  const pctMeta = Math.min(1, feitas / meta)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-border-soft bg-card p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint">
          <Flame size={12} className={seq.estudouHoje ? 'text-primary' : ''} /> Sequência
        </div>
        <div className="mt-1 font-mono text-2xl font-bold text-foreground">
          {seq.atual} {seq.atual === 1 ? 'dia' : 'dias'}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {seq.estudouHoje ? 'Hoje já conta. Continue amanhã!' : seq.atual > 0 ? 'Estude hoje para não perder a sequência.' : 'Estude hoje para começar.'}
          {' '}Recorde: {seq.recorde}.
        </p>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-faint">
          <span className="flex items-center gap-2"><Target size={12} /> Meta de hoje</span>
          <label className="flex items-center gap-1 normal-case tracking-normal">
            meta
            <input
              type="number"
              value={meta}
              onChange={(e) => mudarMeta(Number(e.target.value) || META_PADRAO)}
              className="w-14 rounded border border-border-soft bg-secondary px-1 py-0.5 text-right font-mono text-[11px] text-foreground"
            />
          </label>
        </div>
        <div className="mt-1 font-mono text-2xl font-bold text-foreground">
          {feitas}<span className="text-base text-faint">/{meta}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/40">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pctMeta * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {feitas >= meta ? 'Meta batida! 🎯' : `Faltam ${meta - feitas} questões.`}
        </p>
      </div>

      <div className="rounded-2xl border border-border-soft bg-card p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint">
          <Medal size={12} /> Patente · nível {pat.nivel}
        </div>
        <div className="mt-1 font-display text-xl font-bold text-foreground">{pat.patente.nome}</div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/40">
          <div className="h-full rounded-full bg-tier-good transition-all" style={{ width: `${pat.progresso * 100}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {xp.toLocaleString('pt-BR')} XP
          {pat.proxima ? ` · ${(pat.proxima.xp - xp).toLocaleString('pt-BR')} para ${pat.proxima.nome}` : ' · patente máxima'}
        </p>
      </div>
    </div>
  )
}
