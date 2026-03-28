import { useState, useCallback } from 'react'
import { Upload } from 'lucide-react'
import { useUploadStatement } from '@/hooks/useUpload'
import { cn } from '@/utils/cn'

export default function DropZone() {
  const [dragging, setDragging] = useState(false)
  const { mutate: upload, isPending } = useUploadStatement()

  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') return alert('Only PDF files are allowed')
    upload(file)
  }, [upload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      )}
    >
      <input id="file-input" type="file" accept=".pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {isPending ? (
        <div className="text-center">
          <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Uploading...</p>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">Drop your bank statement here</p>
          <p className="text-sm text-muted-foreground">PDF files only, max 10MB</p>
        </div>
      )}
    </div>
  )
}