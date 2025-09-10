import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectResumeOutline } from '../../state/selectors'
import { useResumeEditor } from '../../context/ResumeEditorContext'
import LoadingDialog from '@/components/ui/loading-dialog'
import { CompactTopToolbar } from '@/components/resume/CompactTopToolbar'

export function ResumeToolbar() {
  const editor = useResumeEditor()
  const sections = useSelector(selectResumeOutline) as Array<any>
  const [busy, setBusy] = useState<null | { title: string; description?: string }>(null)
  useEffect(() => {
    if (editor.importing) {
      setBusy({ title: 'Importing PDF…', description: 'Extracting your resume.' })
    } else if (editor.exporting) {
      setBusy({ title: 'Exporting…', description: 'Preparing your document.' })
    } else if ((editor as any).loading) {
      setBusy({ title: 'Loading…', description: 'Fetching your resume.' })
    } else {
      setBusy(null)
    }
  }, [editor.importing, editor.exporting, (editor as any).loading])
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
          sections={sections as any}
          availableSections={editor.availableSections}
          onAddSection={editor.addSection}
          onRemoveSection={editor.removeSection}
          onReorderSections={editor.reorderSections}
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
        {/* Sections dropdown moved into CompactTopToolbar */}
        <LoadingDialog open={!!busy} title={busy?.title} description={busy?.description} />
    </div>
  )
}

export default ResumeToolbar


