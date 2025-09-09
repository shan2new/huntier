import { useEffect, useState } from 'react'
import { useResumeEditor } from '../../context/ResumeEditorContext'
import LoadingDialog from '@/components/ui/loading-dialog'
import { CompactTopToolbar } from '@/components/resume/CompactTopToolbar'

export function ResumeToolbar() {
  const editor = useResumeEditor()
  const [busy, setBusy] = useState<null | { title: string; description?: string }>(null)
  useEffect(() => {
    if (editor.importing) {
      setBusy({ title: 'Importing PDF…', description: 'Extracting your resume.' })
    } else if (editor.exporting) {
      setBusy({ title: 'Exporting…', description: 'Preparing your document.' })
    } else {
      setBusy(null)
    }
  }, [editor.importing, editor.exporting])
  return (
    <div className="resume-toolbar flex justify-around border-b border-border py-2">
        <CompactTopToolbar
          name={editor.resumeData.name}
          onNameChange={editor.setName}
          saving={editor.saving}
          hasUnsavedChanges={editor.hasUnsavedChanges}
          lastSaved={null}
          templateId={editor.resumeData.template_id}
          onTemplateChange={editor.setTemplateId}
          fontId={editor.resumeData.theme.font}
          onFontChange={editor.setFontId}
          themeId={editor.resumeData.theme.id}
          onThemeChange={editor.setThemeId}
          availableSections={editor.availableSections}
          onAddSection={editor.addSection}
          onOpenJdHub={() => {}}
          onClearChat={() => {}}
          onExportPdf={() => { setBusy({ title: 'Exporting…', description: 'Preparing your document.' }); editor.exportPdf() }}
          onExportDocx={() => { setBusy({ title: 'Exporting…', description: 'Preparing your document.' }); editor.exportDocx() }}
          onImportPdf={(f) => { setBusy({ title: 'Importing PDF…', description: 'Extracting your resume.' }); editor.importPdf(f) }}
          importing={editor.importing}
          exporting={editor.exporting}
          canExport={true}
          onSave={() => editor.handleSave(false)}
        />
        <LoadingDialog open={!!busy} title={busy?.title} description={busy?.description} />
    </div>
  )
}

export default ResumeToolbar


