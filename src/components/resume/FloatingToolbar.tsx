import { Plus, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TemplateSelector } from '@/components/resume/TemplateSelector'
import { FontSelector } from '@/components/resume/FontSelector'
import { ThemeSelector } from '@/components/resume/ThemeSelector'
import type { ResumeTemplateId } from '@/types/resume'
import type { ResumeThemeId } from '@/lib/themes'
import type { ResumeFontId } from '@/types/resume'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type SectionMeta = { type: string; title: string; icon?: React.ReactNode }

type FloatingToolbarProps = {
  templateId?: ResumeTemplateId | string | null
  onTemplateChange?: (id: ResumeTemplateId) => void
  fontId?: ResumeFontId | string
  onFontChange?: (id: ResumeFontId) => void
  themeId?: ResumeThemeId | string
  onThemeChange?: (id: ResumeThemeId) => void

  availableSections?: Array<SectionMeta>
  onAddSection?: (type: string, title: string) => void
}

export function FloatingToolbar({
  templateId,
  onTemplateChange,
  fontId,
  onFontChange,
  themeId,
  onThemeChange,
  availableSections = [],
  onAddSection,
}: FloatingToolbarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center">
      <div className="pointer-events-auto bg-card/90 backdrop-blur border border-border shadow-lg rounded-full h-12 px-3 flex items-center gap-2">
        {/* Left icon group */}
        <div className="flex items-center gap-1">
          {/* Layout / Template */}
          <TemplateSelector value={templateId as any} onChange={onTemplateChange as any} mode="icon" />
          {/* Typography */}
          <FontSelector value={fontId as any} onChange={onFontChange as any} mode="icon" />
          {/* Theme / Accent */}
          <ThemeSelector value={themeId as any} onChange={onThemeChange as any} mode="icon" />
        </div>
        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Primary action */}
        {availableSections.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="rounded-full h-9 px-3">
                <Plus className="h-4 w-4 mr-2" />
                Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {availableSections.map((s) => (
                <DropdownMenuItem key={s.type} onClick={() => onAddSection?.(s.type, s.title)}>
                  {s.icon || <LayoutGrid className="h-4 w-4 mr-2" />} {s.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" className="rounded-full h-9 px-3">
            <Plus className="h-4 w-4 mr-2" />
            Button
          </Button>
        )}
      </div>
    </div>
  )
}

export default FloatingToolbar


