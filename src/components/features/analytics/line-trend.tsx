'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatIDR } from '@/utils/cn'

export interface LineTrendProps<T extends object> {
  data: readonly T[]
  dataKey: string
  xKey?: string
  color?: string
  money?: boolean
  height?: number
}

/** A client-side Recharts area/line trend used for analytics series. */
export function LineTrend<T extends object>({
  data,
  dataKey,
  xKey = 'date',
  color = '#7c3aed',
  money = false,
  height = 260,
}: LineTrendProps<T>) {
  const fmt = (v: unknown) =>
    money ? formatIDR(Number(v)) : String(Number(v).toLocaleString('id-ID'))

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#737373' }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#737373' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (money ? formatIDR(Number(v)).slice(0, 6) : String(v))}
            width={70}
          />
          <Tooltip
            formatter={(value) => fmt(value)}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
