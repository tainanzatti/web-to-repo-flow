import { useMemo } from 'react'
import { Trophy, Percent, CalendarRange } from 'lucide-react'
import { type Lancamento } from '@/lib/curriculum'
import { SectionLabel } from '@/components/ui-bits'

type Props = { lancamentos: Lancamento[]; userName: string }

type Row = { name: string; value: number; isUser?: boolean }

const COMPETITORS_PCT: Row[] = [
  { name: 'Jonatan Guedes Schwanck', value: 92.98 },
  { name: 'João Lisboa', value: 92.81 },
  { name: 'Elizandro Giordani', value: 89.66 },
  { name: 'Marcos Alex Pires de Freitas', value: 89.36 },
  { name: 'Junior Leorimar Frizon', value: 88.79 },
  { name: 'Josué Henrique Stiegelmayer', value: 88.76 },
  { name: 'Gustavo Luiz Cardoso', value: 88.72 },
  { name: 'Fernando Rocha', value: 88.43 },
  { name: 'João Vitor Gomes', value: 88.27 },
  { name: 'Mariana Albuquerque', value: 88.03 },
  { name: 'Davidson Barreiros Tavares', value: 87.61 },
  { name: 'Paulo Sérgio Loes Cipriano', value: 87.01 },
  { name: 'Wallace Nascimento', value: 86.81 },
  { name: 'Marcel Lucas Gomes', value: 86.72 },
  { name: 'Ana Luiza Menegatti', value: 85.9 },
]

const COMPETITORS_DAY: Row[] = [
  { name: 'Éber Ramos', value: 9.6 },
  { name: 'Rodrigo Cunha', value: 9.0 },
  { name: 'Vinicius Simões Maia', value: 8.7 },
  { name: 'Ana Luiza Menegatti', value: 8.0 },
  { name: 'Michel Meireles Dias', value: 7.8 },
  { name: 'Luiz Felipe Quarantani', value: 7.8 },
  { name: 'Vinicius Marques de Souza', value: 7.6 },
  { name: 'Carlos Eduardo Rodrigues', value: 7.5 },
  { name: 'Junior Leorimar Frizon', value: 7.5 },
  { name: 'Caio Silveira', value: 7.4 },
  { name: 'Vinícius Ferrari', value: 7.1 },
  { name: 'Wallace Nascimento', value: 7.0 },
  { name: 'Elizandro Giordani', value: 7.0 },
  { name: 'Thomas Gomes Dutra', value: 6.9 },
  { name: 'Arthur Brikalski', value: 6.9 },
]

function buildBoard(competitors: Row[], user: Row): { rows: Row[]; userRank: number } {
  const all = [...competitors, user].sort((a, b) => b.value - a.value)
  const userRank = all.findIndex((r) => r.isUser) + 1
  return { rows: all.slice(0, 20), userRank }
}

export function RankingView({ lancamentos, userName }: Props) {
  const { pctBoard, dayBoard, resolved } = useMemo(() => {
    const totalQ = lancamentos.reduce((a, e) => a + e.quantidade, 0)
    const totalA = lancamentos.reduce((a, e) => a + e.acertos, 0)
    const userPct = totalQ > 0 ? +((totalA / totalQ) * 100).toFixed(2) : 0
    const days = new Set(lancamentos.map((l) => l.data)).size || 1
    const touched = new Set(lancamentos.map((l) => l.disciplinaId + l.topicoId)).size
    const perDay = +(touched / days).toFixed(1)
    return {
      resolved: totalQ,
      pctBoard: buildBoard(COMPETITORS_PCT, { name: userName, value: userPct, isUser: true }),
      dayBoard: buildBoard(COMPETITORS_DAY, { name: userName, value: perDay, isUser: true }),
    }
  }, [lancamentos, userName])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Board
        title="Percentual de acertos"
        icon={Percent}
        rows={pctBoard.rows}
        userRank={pctBoard.userRank}
        valueLabel="Acertos"
        formatValue={(v) => `${v.toFixed(2)}%`}
        secondaryLabel="Questões"
        secondaryValue={resolved}
      />
      <Board
        title="Assuntos por dia"
        icon={CalendarRange}
        rows={dayBoard.rows}
        userRank={dayBoard.userRank}
        valueLabel="Assuntos/dia"
        formatValue={(v) => `${v.toFixed(1)}/dia`}
      />
    </div>
  )
}

function Board({
  title,
  icon: Icon,
  rows,
  userRank,
  valueLabel,
  formatValue,
  secondaryLabel,
  secondaryValue,
}: {
  title: string
  icon: typeof Trophy
  rows: Row[]
  userRank: number
  valueLabel: string
  formatValue: (v: number) => string
  secondaryLabel?: string
  secondaryValue?: number
}) {
  return (
    <div className="rounded-2xl border border-border-soft bg-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-primary" />
          <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
        </div>
        <span className="rounded-sm bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
          TOP 20
        </span>
      </div>
      <p className="mb-4 text-[11px] text-faint">
        Sua posição: {userRank > 20 ? '100+' : `#${userRank}`}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-faint">
            <th className="pb-2 pr-2 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Nome</th>
            {secondaryLabel && <th className="pb-2 pr-4 text-center font-medium">{secondaryLabel}</th>}
            <th className="pb-2 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.name + i}
              className={`border-b border-border-soft/50 ${
                r.isUser ? 'bg-primary/10' : ''
              }`}
            >
              <td className="py-2 pr-2">
                <span
                  className={`font-mono text-xs font-bold ${
                    i < 3 ? 'text-primary' : 'text-faint'
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`text-[13px] ${
                    r.isUser ? 'font-bold text-primary' : 'font-medium text-foreground'
                  }`}
                >
                  {r.name}
                  {r.isUser && <span className="ml-1.5 text-[10px] text-faint">(você)</span>}
                </span>
              </td>
              {secondaryLabel && (
                <td className="py-2 pr-4 text-center font-mono text-xs text-muted-foreground">
                  {r.isUser ? secondaryValue : 900 + ((i * 373) % 3200)}
                </td>
              )}
              <td className="py-2 text-right font-mono text-xs font-semibold text-foreground">
                {formatValue(r.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
