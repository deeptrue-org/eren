'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartProps {
  data: { date: string; value: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-center text-muted-foreground">
        No trend data
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 60 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              fontSize: '12px',
              padding: '2px 8px',
            }}
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: number) => [value.toLocaleString(), 'Searches']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
