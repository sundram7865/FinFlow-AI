import PageHeader    from '@/components/shared/PageHeader'
import DropZone      from '@/components/upload/DropZone'
import UploadHistory from '@/components/upload/UploadHistory'

export default function UploadPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Upload Statement"
        description="Upload your bank statement PDF to enable AI analysis"
      />
      <DropZone />
      <UploadHistory />
    </div>
  )
}