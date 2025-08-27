import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { cn } from '@/lib/utils'

type SkillsSectionProps = {
  tags: Array<string>
  onChange: (next: Array<string>) => void
}

// Professional skill suggestions for resumes
const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git',
  'AWS', 'Docker', 'Kubernetes', 'REST APIs', 'GraphQL', 'MongoDB', 'PostgreSQL',
  'Agile', 'Scrum', 'CI/CD', 'Machine Learning', 'Data Analysis', 'Excel', 'Tableau',
  'Project Management', 'Leadership', 'Communication', 'Problem Solving'
]

export function SkillsSection({ tags = [], onChange }: SkillsSectionProps) {
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<Array<string>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const sanitize = (s: string) => s.trim().replace(/\s+/g, ' ')

  // Filter suggestions based on input
  useEffect(() => {
    if (draft.trim()) {
      const filtered = SKILL_SUGGESTIONS
        .filter(skill => 
          skill.toLowerCase().startsWith(draft.toLowerCase()) &&
          !tags.includes(skill)
        )
        .slice(0, 6)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [draft, tags])

  const addSkill = (skill?: string) => {
    const value = sanitize(skill || draft)
    if (!value || tags.includes(value)) return
    
    const next = [...tags, value]
    onChange(next)
    setDraft('')
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
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
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
      } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        addSkill(suggestions[selectedSuggestionIndex])
        return
      }
    }

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
      
      {/* Clean Skills Display */}
      <div className="space-y-3">
        {/* Skills Pills */}
        <div className="flex flex-wrap gap-2">
          {tags.map((skill, index) => (
            <div
              key={`${skill}-${index}`}
              className="group relative inline-flex items-center"
            >
              <span className={cn(
                "px-3 py-1.5 text-sm font-medium",
                "bg-gray-100 text-gray-700 rounded-md",
                "border border-gray-200",
                "transition-colors duration-150"
              )}>
                {skill}
              </span>
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className={cn(
                  "absolute -right-1 -top-1",
                  "w-5 h-5 rounded-full",
                  "bg-white border border-gray-300",
                  "flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-red-50 hover:border-red-300",
                  "transition-all duration-150",
                  "shadow-sm"
                )}
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200)
              if (draft.trim()) {
                if (draft.includes(',') || draft.includes('\n') || draft.includes('\t') || draft.includes(';')) {
                  addMany(draft)
                } else {
                  addSkill()
                }
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            placeholder="Add skills"
            className={cn(
              "px-3 py-2",
              "bg-white border-gray-300",
              "focus:border-gray-400 focus:ring-1 focus:ring-gray-400",
              "rounded-md transition-colors",
              "placeholder:text-gray-400"
            )}
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className={cn(
              "absolute top-full left-0 right-0 mt-1 z-20",
              "bg-white border border-gray-200",
              "rounded-md shadow-lg",
              "py-1"
            )}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm",
                    "transition-colors duration-100",
                    selectedSuggestionIndex === index
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Helper Text */}
        <p className="text-xs text-gray-500">
          Press Enter, Tab, or use commas to add multiple skills. Start typing for suggestions.
        </p>
      </div>
    </div>
  )
}

export default SkillsSection


