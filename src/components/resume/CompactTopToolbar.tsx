import { FileDown, FileUp, Save, Sparkles, Trash2 } from 'lucide-react'
import type { ResumeFontId, ResumeTemplateId } from '@/types/resume'
import type { ResumeThemeId } from '@/lib/themes'
import { Button } from '@/components/ui/button'
// import { Separator } from '@/components/ui/separator'
// import { TemplateSelector } from '@/components/resume/TemplateSelector'
// import { FontSelector } from '@/components/resume/FontSelector'
// import { ThemeSelector } from '@/components/resume/ThemeSelector'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'


type SectionMeta = { type: string; title: string; icon?: React.ReactNode }

type CompactTopToolbarProps = {
  name: string
  onNameChange: (v: string) => void
  saving?: boolean
  hasUnsavedChanges?: boolean
  lastSaved?: Date | null

  templateId?: ResumeTemplateId | string | null
  onTemplateChange?: (id: ResumeTemplateId) => void
  fontId?: ResumeFontId | string
  onFontChange?: (id: ResumeFontId | string) => void
  themeId?: ResumeThemeId | string
  onThemeChange?: (id: ResumeThemeId) => void

  availableSections?: Array<SectionMeta>
  onAddSection?: (type: string, title: string) => void

  onOpenJdHub?: () => void
  onClearChat?: () => void
  onExportPdf?: () => void
  onExportDocx?: () => void
  onImportPdf?: (file: File) => void
  importing?: boolean
  exporting?: boolean
  canExport?: boolean
  onSave?: () => void
}

export function CompactTopToolbar({
  name,
  onNameChange,
  saving,
  hasUnsavedChanges,
  lastSaved,
  onOpenJdHub,
  onClearChat,
  onExportPdf,
  onExportDocx,
  onImportPdf,
  importing,
  exporting,
  canExport = true,
  onSave,
}: CompactTopToolbarProps) {
  const getSaveStatus = () => {
    if (saving) return 'Saving…'
    if (hasUnsavedChanges) return 'Unsaved'
    if (lastSaved) return 'Saved'
    return ''
  }
  return (
    <div className="resume-toolbar flex justify-around">
      <div className="flex items-center justify-between gap-3 w-2xl bg-card border border-border px-4 py-1 my-2 rounded-lg">
        {/* Left: name + save status */}
        <div className="flex items-center gap-3 min-w-0">
          <Input value={name} onChange={(e) => onNameChange(e.target.value)} className="h-6 text-xs border-none text-left" placeholder="Untitled Resume" />
          {getSaveStatus() ? (
            <span className="text-xs text-muted-foreground">
              {getSaveStatus()}
            </span>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onOpenJdHub} title="Analyze JD">
            <Sparkles className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" title="Export" disabled={!!exporting || !canExport}>
                <FileDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
              <DropdownMenuItem onClick={onExportPdf} disabled={!!exporting || !canExport}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={onExportDocx} disabled={!!exporting || !canExport}>Word</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <label className="inline-flex items-center">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportPdf?.(f); e.currentTarget.value = '' }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title={importing ? 'Importing…' : 'Import PDF'}
              onClick={(ev) => {
                const input = ev.currentTarget.previousSibling as HTMLInputElement | null
                if (input) input.click()
              }}
            >
              <FileUp className="h-4 w-4" />
            </Button>
          </label>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClearChat} title="Clear Chat">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="sm" className="h-8" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CompactTopToolbar


