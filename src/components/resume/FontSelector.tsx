import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getResumeFont, RESUME_FONT_LIST } from '@/lib/fonts'
import type { ResumeFontId } from '@/types/resume'

type FontSelectorProps = {
  value?: ResumeFontId | string
  onChange?: (id: ResumeFontId) => void
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  const current = getResumeFont((value as any) || 'inter')
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Font: {current.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[320px] p-0">
        <ScrollArea className="h-[320px] p-2">
          <div className="grid grid-cols-1 gap-2">
            {RESUME_FONT_LIST.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange?.(f.id)}
                className={cn(
                  'group text-left rounded-md border p-2 hover:bg-muted transition-colors',
                  value === f.id ? 'border-primary' : 'border-border'
                )}
              >
                <div className="text-xs font-medium mb-1">{f.name}</div>
                <div className="rounded-sm bg-white ring-1 ring-border p-2">
                  <div style={{ fontFamily: f.stack }} className="space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.14em]">Heading</div>
                    <div className="text-[11px]">Body text example</div>
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

export default FontSelector


