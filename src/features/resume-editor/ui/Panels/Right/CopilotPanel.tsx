import { useMemo } from 'react'
import { ResumeCopilotBindings } from '@/components/resume/ResumeCopilotBindings'
import { useResumeCopilotBindings } from '../../../copilot/useCopilotBindings'
import { useResumeEditor } from '../../../context/ResumeEditorContext'
import { ResumeChat } from '../../chat/ResumeChat'

export function CopilotPanel() {
  useResumeEditor()
  const instructions = useMemo(() => (
    'You are a resume assistant. Suggest concise edits and ask clarifying questions when unsure.'
  ), [])
  useMemo(() => ({
    title: 'Assistant',
    initial: 'How can I help with your resume?',
  }), [])

  useResumeCopilotBindings()
  return (
    <div className="h-full bg-background text-foreground font-[Outfit]">
      <ResumeCopilotBindings />
      <ResumeChat className="h-full" instructions={instructions} />
    </div>
  )
}

export default CopilotPanel


