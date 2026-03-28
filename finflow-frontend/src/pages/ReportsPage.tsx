import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader  from '@/components/shared/PageHeader'
import ReportCard  from '@/components/reports/ReportCard'
import EmptyState  from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { useReports, useGenerateReport } from '@/hooks/useReports'

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useReports()
  const { mutate: generate, isPending } = useGenerateReport()
  const now = new Date()

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Monthly AI-generated financial reports"
        action={
          <Button onClick={() => generate({ month: now.getMonth() + 1, year: now.getFullYear() })} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? 'Generating...' : 'Generate Report'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet"
          description="Generate your first monthly report to get AI-powered insights."
          action={<Button onClick={() => generate({ month: now.getMonth() + 1, year: now.getFullYear() })}>Generate now</Button>}
        />
      ) : (
        <div className="space-y-4">
          {reports.map(report => <ReportCard key={report.id} report={report} />)}
        </div>
      )}
    </div>
  )
}