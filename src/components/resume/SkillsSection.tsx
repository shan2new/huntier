import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type SkillsSectionProps = {
  tags: Array<string>
  onChange: (next: Array<string>) => void
}

export function SkillsSection({ tags = [], onChange }: SkillsSectionProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const sanitize = (s: string) => s.trim().replace(/\s+/g, ' ')


  const addSkill = (skill?: string) => {
    const value = sanitize(skill || draft)
    if (!value || tags.includes(value)) return
    
    const next = [...tags, value]
    onChange(next)
    setDraft('')
  }

  const addMany = (raw: string) => {
    const parts = raw
      .split(/\n|,|;|\t/)
      .map((p) => sanitize(p))
      .filter(Boolean)
      .filter(skill => !tags.includes(skill))
    
    if (!parts.length) return
    const next = [...tags, ...parts]
    onChange(next)
    setDraft('')
  }

  const removeSkill = (index: number) => {
    const next = tags.filter((_, i) => i !== index)
    onChange(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault()
      if (draft.includes(',') || draft.includes('\n') || draft.includes('\t') || draft.includes(';')) {
        addMany(draft)
      } else {
        addSkill()
      }
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Skills" />

      <div className="space-y-3">
        {/* Skills Chips */}
        <div className="flex flex-wrap space-x-2">
          {tags.map((skill, index) => (
            <div key={`${skill}-${index}`} className="group inline-flex items-center mt-2">
              <Badge className="px-2 py-0.5 text-xs bg-gray-200 text-gray-800 hover:text-gray-800 hover:bg-gray-400">
                {skill}
                <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSkill(index)}
                aria-label={`Remove ${skill}`}
                className="h-4 w-4 hidden group-hover:inline-flex transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
              </Badge>

            </div>
          ))}
        </div>

        {/* Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (draft.trim()) {
                if (draft.includes(',') || draft.includes('\n') || draft.includes('\t') || draft.includes(';')) {
                  addMany(draft)
                } else {
                  addSkill()
                }
              }
            }}
            placeholder="Add skills"
            className={cn('bg-gray-200 text-gray-800 border-gray-300')}
            aria-label="Add skills"
          />
        </div>

        <p className="text-xs text-muted-foreground">Press Enter, Tab, or use commas to add multiple skills.</p>
      </div>
    </div>
  )
}

export default SkillsSection


