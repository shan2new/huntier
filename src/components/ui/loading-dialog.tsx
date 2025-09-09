import { Dialog, DialogContent } from '@/components/ui/dialog'

type LoadingDialogProps = {
  open: boolean
  title?: string
  description?: string
  progressText?: string
}

export function LoadingDialog({ open, title = 'Working…', description = 'Please wait while we finish this task.', progressText }: LoadingDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[380px] bg-card text-foreground border-border">
        <div className="flex items-start gap-3">
          <svg className="animate-spin h-5 w-5 mt-0.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <div className="space-y-1">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
            {progressText ? (<div className="text-xs text-muted-foreground">{progressText}</div>) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoadingDialog


