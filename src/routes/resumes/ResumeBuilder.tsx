import { EditorShell } from '@/features/resume-editor/ui/EditorShell'
import { ResumeEditorProvider } from '@/features/resume-editor/context/ResumeEditorContext'

export function ResumeBuilder({ resumeId }: { resumeId: string }) {
  return (
    <div className="document-viewer h-full overflow-hidden">
      <div className="px-0 py-0 h-full w-full flex flex-col overflow-hidden">
        <ResumeEditorProvider resumeId={resumeId}>
          <EditorShell />
        </ResumeEditorProvider>
      </div>
    </div>
  )
}

export default ResumeBuilder


