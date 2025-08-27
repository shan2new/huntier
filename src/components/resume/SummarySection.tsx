import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { SectionHeader } from '@/components/resume/SectionHeader'

type SummarySectionProps = {
  text: string
  onChange: (text: string) => void
}

export function SummarySection({ text, onChange }: SummarySectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Professional Summary" />
      <div className="relative group">
        <ResumeInlineEditable 
          value={text} 
          onChange={onChange} 
          placeholder="Write a concise, impactful summary highlighting your key strengths and career objectives..." 
          className="text-sm leading-relaxed text-gray-700 block w-full px-3 rounded-md hover:bg-gray-50/50 transition-colors"
          multiline 
        />
        <div className="absolute inset-0 rounded-md border-2 border-transparent group-hover:border-gray-200/50 pointer-events-none transition-colors" />
      </div>
    </div>
  )
}

export default SummarySection


