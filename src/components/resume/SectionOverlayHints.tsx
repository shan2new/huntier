import { Button } from '@/components/ui/button'

export type OverlayHint = {
  id: string
  type: 'missing_keyword' | 'skill_alignment' | 'rewrite' | 'ats' | 'role_level' | 'reorder'
  message: string
  suggestion?: string
  score?: number
}

type SectionOverlayHintsProps = {
  hints: Array<OverlayHint>
  onApply?: (hint: OverlayHint) => void
  onDismiss?: (hint: OverlayHint) => void
}

export function SectionOverlayHints({ hints, onApply, onDismiss }: SectionOverlayHintsProps) {
  if (!hints || hints.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-card p-3 space-y-2">
      {hints.map((h) => (
        <div key={h.id} className="flex items-start justify-between gap-2">
          <div className="text-xs">
            <div className="font-medium">{h.message}</div>
            {h.suggestion && <div className="text-muted-foreground mt-1">Suggestion: {h.suggestion}</div>}
            {typeof h.score === 'number' && <div className="text-[10px] mt-1">Relevance: {Math.round(h.score * 100)}%</div>}
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {onApply && (
              <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => onApply(h)}>Apply</Button>
            )}
            {onDismiss && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => onDismiss(h)}>Dismiss</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SectionOverlayHints


