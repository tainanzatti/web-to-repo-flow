import { useMemo } from "react";

interface BarChartProps { data: { label: string; value: number; color?: string }[]; height?: number; maxBars?: number; }
export function BarChart({ data, height = 200, maxBars = 12 }: BarChartProps) {
  const display = data.slice(0, maxBars);
  const maxVal = useMemo(() => Math.max(1, ...display.map((d) => d.value)), [display]);
  if (display.length === 0) return <p className="text-sm text-ink-400 text-center py-8">Sem dados para exibir.</p>;
  return <div className="flex items-end gap-2" style={{ height }}>{display.map((d, i) => { const h = (d.value / maxVal) * (height - 30); return <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group min-w-0"><span className="text-xs text-ink-500 dark:text-ink-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{d.value}</span><div className={`w-full rounded-t-md transition-all duration-300 hover:opacity-80 ${d.color ?? "bg-brand-500"}`} style={{ height: Math.max(2, h) }} /><span className="text-[10px] text-ink-400 dark:text-ink-500 truncate w-full text-center" title={d.label}>{d.label}</span></div>; })}</div>;
}

interface LineChartProps { data: { label: string; value: number }[]; height?: number; color?: string; formatValue?: (v: number) => string; }
export function LineChart({ data, height = 200, color = "stroke-brand-500", formatValue }: LineChartProps) {
  if (data.length === 0) return <p className="text-sm text-ink-400 text-center py-8">Sem dados para exibir.</p>;
  const width = 600; const padding = 30;
  const maxVal = Math.max(1, ...data.map((d) => d.value)); const minVal = Math.min(0, ...data.map((d) => d.value)); const range = maxVal - minVal || 1;
  const points = data.map((d, i) => ({ x: padding + (i / Math.max(1, data.length - 1)) * (width - 2 * padding), y: height - padding - ((d.value - minVal) / range) * (height - 2 * padding), ...d }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  return <div className="w-full overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 300 }}><defs><linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.15" className="text-brand-500" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-brand-500" /></linearGradient></defs>{[0, 0.25, 0.5, 0.75, 1].map((t) => { const y = padding + t * (height - 2 * padding); const val = maxVal - t * range; return <g key={t}><line x1={padding} y1={y} x2={width - padding} y2={y} className="stroke-ink-100 dark:stroke-ink-800" strokeWidth="1" /><text x={padding - 5} y={y + 3} textAnchor="end" className="fill-ink-400 text-[10px]">{formatValue ? formatValue(val) : Math.round(val)}</text></g>; })}<path d={areaD} fill="url(#lineGrad)" /><path d={pathD} fill="none" className={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />{points.map((p, i) => <g key={i} className="group"><circle cx={p.x} cy={p.y} r="3" className="fill-white dark:fill-ink-900 stroke-brand-500" strokeWidth="2" /><text x={p.x} y={height - padding + 12} textAnchor="middle" className="fill-ink-400 text-[9px]">{p.label}</text></g>)}</svg></div>;
}
