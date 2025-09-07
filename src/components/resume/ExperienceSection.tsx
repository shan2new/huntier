import { Briefcase, Loader2, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InlineEditable } from '@/components/resume/InlineEditable'
import { SectionHeader } from '@/components/resume/SectionHeader'

export type ExperienceItem = {
  company?: string
  role?: string
  startDate?: string
  endDate?: string
  bullets?: Array<string>
  company_logo?: string
}

type ExperienceSectionProps = {
  items: Array<ExperienceItem>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onChangeField: (index: number, field: 'company' | 'role' | 'startDate' | 'endDate', value: string) => void
  onAddBullet: (index: number) => void
  onRemoveBullet: (index: number, bulletIndex: number) => void
  onChangeBullet: (index: number, bulletIndex: number, text: string) => void
  onSuggestBullets?: (index: number) => void
  onEnhanceBullet?: (index: number, bulletIndex: number, text: string) => Promise<string>
}

export function ExperienceSection({
  items,
  onAddItem,
  onRemoveItem,
  onChangeField,
  onAddBullet,
  onRemoveBullet,
  onChangeBullet,
  onSuggestBullets,
  onEnhanceBullet,
}: ExperienceSectionProps) {
  const [improvingKey, setImprovingKey] = useState<string | null>(null)
  const [highlightKey, setHighlightKey] = useState<string | null>(null)

  const improve = async (index: number, bulletIndex: number, current: string) => {
    if (!onEnhanceBullet) return
    const key = `${index}:${bulletIndex}`
    setImprovingKey(key)
    try {
      const next = await onEnhanceBullet(index, bulletIndex, current)
      if (typeof next === 'string' && next.trim() && next.trim() !== current.trim()) {
        onChangeBullet(index, bulletIndex, next.trim())
        setHighlightKey(key)
        setTimeout(() => setHighlightKey((prev) => (prev === key ? null : prev)), 1200)
      }
    } catch {
      // swallow
    } finally {
      setImprovingKey((prev: string | null) => (prev === key ? null : prev))
    }
  }

  return (
    <div>
      <SectionHeader
        title="Work Experience"
        right={(
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddItem}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Position
          </Button>
        )}
      />
      <div>
        {items.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer group"
               onClick={onAddItem}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3 group-hover:bg-gray-200 transition-colors">
              <Briefcase className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Add your work experience</p>
            <p className="text-sm text-gray-500">Click here to add your first position</p>
          </div>
        )}
        {items.map((exp: ExperienceItem, idx: number) => (
          <div key={idx} className="group relative pr-5 py-5 rounded-lg hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {exp.company_logo && (
                  <img 
                    src={exp.company_logo} 
                    alt={`${exp.company} logo`}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-200"
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline text-base">
                    <InlineEditable 
                      value={exp.role || ''} 
                      onChange={(v) => onChangeField(idx, 'role', v)} 
                      placeholder="Senior Software Engineer" 
                      className="font-semibold text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
                    />
                    <span className="text-gray-500">at</span>
                    <InlineEditable 
                      value={exp.company || ''} 
                      onChange={(v) => onChangeField(idx, 'company', v)} 
                      placeholder="Company Name" 
                      className="font-medium text-gray-800 hover:bg-gray-100 px-2 py-1 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <InlineEditable 
                      value={exp.startDate || ''} 
                      onChange={(v) => onChangeField(idx, 'startDate', v)} 
                      placeholder="Jan 2020" 
                      className="hover:bg-gray-100 px-2 py-0.5 rounded"
                    />
                    <span className="text-gray-400">–</span>
                    <InlineEditable 
                      value={exp.endDate || ''} 
                      onChange={(v) => onChangeField(idx, 'endDate', v)} 
                      placeholder="Present" 
                      className="hover:bg-gray-100 px-2 py-0.5 rounded"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onAddBullet(idx)} 
                  aria-label="Add bullet"
                  className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {onSuggestBullets && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onSuggestBullets(idx)} 
                    aria-label="Suggest bullets"
                    className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => onRemoveItem(idx)} 
                  aria-label="Remove experience"
                  className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {(exp.bullets || ['']).map((bullet: string, bulletIdx: number) => (
                <li key={bulletIdx} className="group/bullet relative flex items-start gap-3">
                  <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <div className="flex-1 pl-5">
                    <InlineEditable 
                      value={bullet} 
                      onChange={(v) => onChangeBullet(idx, bulletIdx, v)} 
                      placeholder="Led cross-functional team to deliver key feature, improving user engagement by 25%" 
                      className={`text-sm leading-relaxed text-gray-700 hover:bg-gray-100 px-2 py-1 -mx-2 -my-1 rounded transition-colors min-h-[1.625rem] ${highlightKey === `${idx}:${bulletIdx}` ? 'bg-yellow-50 ring-1 ring-yellow-200' : ''}`}
                      multiline 
                    />
                  </div>
                  <div className="opacity-0 group-hover/bullet:opacity-100 transition-all duration-200 flex flex-col items-center self-start ml-2 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-primary/10 text-primary"
                      onClick={() => improve(idx, bulletIdx, bullet)}
                      aria-label="Improve bullet with AI"
                      disabled={!onEnhanceBullet || improvingKey === `${idx}:${bulletIdx}`}
                    >
                      {improvingKey === `${idx}:${bulletIdx}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                    </Button>
                    {(exp.bullets || []).length > 1 && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 hover:bg-red-100 text-red-600" 
                        onClick={() => onRemoveBullet(idx, bulletIdx)} 
                        aria-label="Remove bullet"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExperienceSection


