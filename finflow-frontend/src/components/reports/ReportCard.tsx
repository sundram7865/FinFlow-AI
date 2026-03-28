import { FileText, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Report } from '@/types/report.types'
import { formatMonthYear, formatDate } from '@/utils/format'

interface Props { report: Report }

export default function ReportCard({ report }: Props) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{formatMonthYear(report.month, report.year)}</h3>
          {report.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.summary}</p>}
          <p className="text-xs text-muted-foreground mt-2">Generated {formatDate(report.createdAt)}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-1" /> Download
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}