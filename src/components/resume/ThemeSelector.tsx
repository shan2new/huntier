import { RESUME_THEME_LIST, type ResumeThemeId, getResumeTheme } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type ThemeSelectorProps = {
  value?: ResumeThemeId | string
  onChange?: (id: ResumeThemeId) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const current = getResumeTheme((value as any) || 'minimal')
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Theme: {current.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
        <ScrollArea className="h-[320px] p-2">
          <div className="grid grid-cols-2 gap-2">
            {RESUME_THEME_LIST.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange?.(t.id)}
                className={cn(
                  'group text-left rounded-md border p-2 hover:bg-muted transition-colors',
                  value === t.id ? 'border-primary' : 'border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded-sm ring-1 ring-border', t.previewAccent)} />
                  <div>
                    <div className="text-xs font-medium">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</div>
                  </div>
                </div>
                <div className="mt-2 rounded-sm bg-white ring-1 ring-border overflow-hidden">
                  <div className={cn('h-1.5', t.previewAccent)} />
                  <div className="p-2">
                    <div className={cn('text-[10px] uppercase', t.headingClass)}>Heading</div>
                    <div className={cn('text-[11px] mt-1', t.bodyClass)}>Body text example</div>
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

export default ThemeSelector


