
import { DownloadIcon, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type ResumeToolbarProps = {
  name: string
  onNameChange: (name: string) => void
  templateId: string | null
  onTemplateChange: (templateId: string | null) => void
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
}

export function ResumeToolbar({
  name,
  onNameChange,
  templateId,
  onTemplateChange,
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
      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-card-foreground flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</h3>
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
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Untitled Resume"
            className="h-9"
          />
          <div className="flex justify-between">
          <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="text-xs">
                    <DownloadIcon className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-32">
                  <DropdownMenuItem onClick={onExportPdf}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={onExportDocx}>Word</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-2">
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
                  <Button size="sm" variant="outline" className="text-xs" disabled={!!importing} onClick={(ev) => {
                    const input = (ev.currentTarget.previousSibling as HTMLInputElement)
                    input.click()
                  }}>Import PDF</Button>
                </label>
              </div>
              <Button size="sm" className="text-xs" onClick={onSave}>Save</Button>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="resume-toolbar">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center gap-4">
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-lg font-medium text-foreground bg-transparent border-0 outline-none focus:ring-0 px-0"
              placeholder="Untitled Resume"
              style={{ minWidth: '200px' }}
            />
            {getSaveStatus() && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
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

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {/* Template Selector */}
            <select
              value={templateId || ''}
              onChange={(e) => onTemplateChange(e.target.value || null)}
              className="h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Default Template</option>
              <option value="compact">Compact</option>
              <option value="elegant">Elegant</option>
            </select>

            {/* Export Dropdown */}
            <div className="relative group">
              <Button 
                variant="ghost"
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {exporting && (
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                Export
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                <button
                  onClick={onExportPdf}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  PDF
                </button>
                <button
                  onClick={onExportDocx}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Word
                </button>
              </div>
            </div>
            {/* Import PDF */}
            <div>
              <input
                type="file"
                accept="application/pdf"
                id="resume-import-pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && onImportPdf) onImportPdf(file)
                  e.currentTarget.value = ''
                }}
              />
              <label htmlFor="resume-import-pdf">
                <Button variant="outline" className="text-sm" disabled={!!importing}>Import PDF</Button>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeToolbar


