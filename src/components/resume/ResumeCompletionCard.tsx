import { Circle } from "lucide-react"

type ResumeCompletionCardProps = {
  title?: string
  progress: number
  missingItems: Array<string>
}

export function ResumeCompletionCard({ title = 'Progress', progress, missingItems }: ResumeCompletionCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4" />
          <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-2 rounded-full progress-bar bg-primary w-[${progress}]`}
        />
      </div>

      {missingItems.length > 0 && (
        <div className="space-y-1">
          {missingItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-card-foreground/80">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--muted-foreground))' }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResumeCompletionCard


