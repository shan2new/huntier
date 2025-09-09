import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RESUME_TEMPLATE_LIST, getResumeTemplate } from '@/lib/templates'
import type { ResumeTemplateId } from '@/types/resume'
import { cn } from '@/lib/utils'

type TemplateSelectorProps = {
  value?: ResumeTemplateId | string | null
  onChange?: (id: ResumeTemplateId) => void
  mode?: 'default' | 'icon'
}

export function TemplateSelector({ value, onChange, mode = 'default' }: TemplateSelectorProps) {
  const current = getResumeTemplate((value as any) || 'single')
  return (
    <Popover>
      <PopoverTrigger asChild>
        {mode === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Template">
            <span className="i-lucide-layout-grid h-4 w-4" />
            <span className="sr-only">Template</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-xs">
            {current.name}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[320px] p-0">
        <ScrollArea className="h-[280px] p-2">
          <div className="grid grid-cols-1 gap-2">
            {RESUME_TEMPLATE_LIST.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange?.(t.id)}
                className={cn(
                  'group text-left rounded-md border p-2 hover:bg-muted transition-colors',
                  value === t.id ? 'border-primary' : 'border-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default TemplateSelector


