import { LineChart as RechartsLineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface ChartDataPoint {
  date: string;
  value: number;
}

export function LineChart({ data, height = 200, color = "#3385ff" }: { data: ChartDataPoint[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#828c9f" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#828c9f" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e2025", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
          labelStyle={{ color: "#828c9f" }}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
