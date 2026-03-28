import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/utils/format'

interface Props { data: { month: string; income: number; expense: number }[] }

export default function SpendingTrendChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => formatNumber(Number(v ?? 0))} />
            <Legend />
            <Line type="monotone" dataKey="income"  stroke="#1D9E75" strokeWidth={2} dot={false} name="Income" />
            <Line type="monotone" dataKey="expense" stroke="#E24B4A" strokeWidth={2} dot={false} name="Expense" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}