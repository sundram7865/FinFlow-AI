import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CATEGORY_COLORS } from '@/utils/constants'
import { formatNumber } from '@/utils/format'

interface Props { data: Record<string, number> }

export default function CategoryBarChart({ data }: Props) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatNumber} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatNumber(Number(v ?? 0))} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888780'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}