import { useState } from 'react'
import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { Button } from '@/components/ui/button'
import { Loader2, Wand2 } from 'lucide-react'

type SummarySectionProps = {
  text: string
  onChange: (text: string) => void
  onEnhance?: (current: string) => Promise<string>
}

export function SummarySection({ text, onChange, onEnhance }: SummarySectionProps) {
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(false)

  const handleEnhance = async () => {
    if (!onEnhance || !text?.trim()) return
    setLoading(true)
    try {
      const next = await onEnhance(text)
      if (typeof next === 'string' && next.trim() && next.trim() !== text.trim()) {
        onChange(next.trim())
        setHighlight(true)
        setTimeout(() => setHighlight(false), 1200)
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-3">
      <SectionHeader title="Professional Summary" />
      <div className="relative group">
        <ResumeInlineEditable 
          value={text} 
          onChange={onChange} 
          placeholder="Write a concise, impactful summary highlighting your key strengths and career objectives..." 
          className={`text-sm leading-relaxed text-gray-700 block w-full px-3 rounded-md hover:bg-gray-50/50 transition-colors ${highlight ? 'bg-yellow-50 ring-1 ring-yellow-200' : ''}`}
          multiline 
        />
        <div className="absolute inset-0 rounded-md border-2 border-transparent group-hover:border-gray-200/50 pointer-events-none transition-colors" />
        {onEnhance ? (
          <div className="absolute right-2 -top-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-primary hover:bg-primary/10"
              onClick={handleEnhance}
              disabled={loading}
              aria-label="Improve summary with AI"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="ml-1 text-xs">Improve</span>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SummarySection


