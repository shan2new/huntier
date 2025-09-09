
import { DownloadIcon, Settings, UploadIcon, Trash2, FileUp, FileDown, Sparkles, Save } from 'lucide-react'
import type { ResumeFontId } from '@/types/resume'
import type { ResumeThemeId } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ThemeSelector } from '@/components/resume/ThemeSelector'
import { FontSelector } from '@/components/resume/FontSelector'
import { TemplateSelector } from '@/components/resume/TemplateSelector'
import type { ResumeTemplateId } from '@/types/resume'

type ResumeToolbarProps = {
  name: string
  onNameChange: (name: string) => void
  onExportPdf: () => void
  onExportDocx: () => void
  onImportPdf?: (file: File) => void
  onSave: () => void
  saving?: boolean
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
  variant?: 'bar' | 'card'
  importing?: boolean
  exporting?: boolean
  themeId?: ResumeThemeId | string
  onThemeChange?: (id: ResumeThemeId) => void
  fontId?: ResumeFontId | string
  onFontChange?: (id: ResumeFontId) => void
  templateId?: ResumeTemplateId | string | null
  onTemplateChange?: (id: ResumeTemplateId) => void
  onOpenJdHub?: () => void
  onClearChat?: () => void
  iconMode?: boolean
  extraActions?: React.ReactNode
}

export function ResumeToolbar({
  name,
  onNameChange,
  onExportPdf,
  onExportDocx,
  onImportPdf,
  onSave,
  saving,
  lastSaved,
  hasUnsavedChanges,
  variant = 'bar',
  importing,
  exporting,
  themeId,
  onThemeChange,
  fontId,
  onFontChange,
  templateId,
  onTemplateChange,
  onOpenJdHub,
  onClearChat,
  iconMode = false,
  extraActions,
}: ResumeToolbarProps) {
  const getSaveStatus = () => {
    if (saving) return 'Saving...'
    if (hasUnsavedChanges) return 'Saving...'
    if (lastSaved) {
      const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)
      if (seconds < 60) return 'Saved'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `Saved ${minutes}m ago`
      return 'Saved'
    }
    return ''
  }
  if (variant === 'card') {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 slide-in-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-card-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" /> 
            Settings
          </h3>
          {getSaveStatus() && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {(saving || hasUnsavedChanges) && (
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {!saving && !hasUnsavedChanges && (
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {getSaveStatus()}
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Resume Name */}
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Untitled Resume"
              className="h-9 text-sm"
            />
          </div>

          {/* Theme & Template */}
          <div className="space-y-2 w-full flex justify-center gap-2">
            <ThemeSelector value={themeId} onChange={onThemeChange} />
            <TemplateSelector value={templateId as any} onChange={onTemplateChange} />
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="text-xs h-8 w-full" variant="secondary" onClick={onOpenJdHub}>Analyze JD</Button>
              <Button size="sm" className="text-xs h-8 w-full" variant="outline" onClick={onClearChat}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear Chat
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="text-xs h-8 w-full" disabled={!!exporting} aria-busy={!!exporting}>
                    {exporting ? (
                      <>
                        <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Exporting…
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="w-3 h-3 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-32">
                  <DropdownMenuItem onClick={onExportPdf} disabled={!!exporting}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={onExportDocx} disabled={!!exporting}>Word</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <label className="inline-flex items-center">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && onImportPdf) onImportPdf(file)
                    e.currentTarget.value = ''
                  }}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8 w-full" 
                  disabled={!!importing} 
                  onClick={(ev) => {
                    const input = (ev.currentTarget.previousSibling as HTMLInputElement)
                    input.click()
                  }}
                >
                  <UploadIcon className="w-3 h-3 mr-1" />
                  {importing ? 'Importing...' : 'Import'}
                </Button>
              </label>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1" />
              <div className="shrink-0"><FontSelector value={fontId} onChange={onFontChange} /></div>
            </div>
            
            <Button 
              size="sm" 
              className="text-xs h-8 w-full" 
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="resume-toolbar border-b border-border bg-background/70 backdrop-blur">
      <div className="px-6 py-2">
        <div className="flex items-center gap-3">
          {/* Title + Save status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-base font-medium text-foreground bg-transparent border-0 outline-none focus:ring-0 px-0 truncate"
              placeholder="Untitled Resume"
            />
            {getSaveStatus() && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                {(saving || hasUnsavedChanges) && (
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                {!saving && !hasUnsavedChanges && (
                  <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {getSaveStatus()}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeSelector value={themeId} onChange={onThemeChange} mode={iconMode ? 'icon' : 'default'} />
            <FontSelector value={fontId} onChange={onFontChange} mode={iconMode ? 'icon' : 'default'} />
            <TemplateSelector value={templateId as any} onChange={onTemplateChange} mode={iconMode ? 'icon' : 'default'} />
            {extraActions}
            <Button variant={iconMode ? 'ghost' : 'outline'} size={iconMode ? 'icon' : 'sm'} onClick={onOpenJdHub} aria-label="Analyze JD">
              {iconMode ? <Sparkles className="h-4 w-4" /> : 'Analyze JD'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={iconMode ? 'ghost' : 'outline'} size={iconMode ? 'icon' : 'sm'} disabled={!!exporting} aria-busy={!!exporting} aria-label="Export">
                  {iconMode ? (
                    exporting ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <FileDown className="h-4 w-4" />
                  ) : (
                    <>
                      {exporting && <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>}
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-32">
                <DropdownMenuItem onClick={onExportPdf} disabled={!!exporting}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={onExportDocx} disabled={!!exporting}>Word</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <label className="inline-flex items-center">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && onImportPdf) onImportPdf(file)
                  e.currentTarget.value = ''
                }}
              />
              <Button variant={iconMode ? 'ghost' : 'outline'} size={iconMode ? 'icon' : 'sm'} disabled={!!importing} aria-label="Import PDF" onClick={(ev) => {
                const input = (ev.currentTarget.previousSibling as HTMLInputElement)
                input.click()
              }}>
                {iconMode ? <FileUp className="h-4 w-4" /> : 'Import PDF'}
              </Button>
            </label>
            <Button size={iconMode ? 'icon' : 'sm'} className={iconMode ? 'h-8 w-8' : 'text-xs h-8'} onClick={onSave} disabled={saving} aria-label="Save">
              {iconMode ? <Save className="h-4 w-4" /> : (saving ? 'Saving...' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeToolbar


