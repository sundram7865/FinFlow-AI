import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CATEGORY_COLORS } from '@/utils/constants'
import { formatCurrency } from '@/utils/format'

interface Props { data: Record<string, number> }

export default function ExpensePieChart({ data }: Props) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Expense Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] ?? '#888780'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}