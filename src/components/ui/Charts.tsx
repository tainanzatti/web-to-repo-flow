interface BarChartProps { data: { label: string; value: number; color?: string }[]; height?: number; }
export function BarChart({ data, height = 200 }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return <div className="flex items-end gap-2" style={{ height }}>{data.map((d, i) => <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${(d.value / maxVal) * (height - 30)}px`, minHeight: d.value > 0 ? "4px" : "0" }}><div className={`w-full h-full rounded-t-lg ${d.color ?? "bg-brand-500"}`} /></div><span className="text-xs text-ink-400 truncate max-w-full">{d.label}</span></div>)}</div>;
}
interface LineChartProps { data: { date: string; value: number }[]; height?: number; color?: string; }
export function LineChart({ data, height = 200, color = "#3385ff" }: LineChartProps) {
  if (data.length === 0) return <div className="flex items-center justify-center text-sm text-ink-400" style={{ height }}>Sem dados</div>;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const w = 100; const h = 100; const stepX = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((d, i) => `${i * stepX},${h - (d.value / maxVal) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}
