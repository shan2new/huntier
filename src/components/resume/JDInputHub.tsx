import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type JDInputHubProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: { url?: string; text?: string; files?: Array<File> }) => void
  busy?: boolean
}

export function JDInputHub({ open, onClose, onSubmit, busy }: JDInputHubProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [files, setFiles] = useState<Array<File>>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const onPick = () => inputRef.current?.click()

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Analyze a Job Description</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Public JD URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com/jobs/123" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Paste JD Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-28 rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Paste the role description here" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Screenshot/PDF</label>
            <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => {
              const f = Array.from(e.target.files || [])
              setFiles(f)
              e.currentTarget.value = ''
            }} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPick}>Choose file(s)</Button>
              <div className="text-xs text-muted-foreground">{files.length ? `${files.length} selected` : 'None selected'}</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" disabled={busy} onClick={() => onSubmit({ url: url || undefined, text: text || undefined, files })}>
              {busy ? 'Analyzing…' : 'Analyze'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default JDInputHub


