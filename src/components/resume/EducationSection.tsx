import { Button } from '@/components/ui/button'
import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { Plus, Trash2, GraduationCap } from 'lucide-react'

export type EducationItem = {
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
  gpa?: string
}

type EducationSectionProps = {
  items: Array<EducationItem>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onChangeField: (index: number, field: keyof EducationItem, value: string) => void
}

export function EducationSection({
  items,
  onAddItem,
  onRemoveItem,
  onChangeField,
}: EducationSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Education"
        right={(
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddItem}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Education
          </Button>
        )}
      />
      <div className="space-y-5">
        {items.length === 0 && (
          <div className="text-center py-8 border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer group bg-gray-50/30"
               onClick={onAddItem}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-3 group-hover:shadow-sm transition-all border border-gray-200">
              <GraduationCap className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm mb-1">Add your educational background</p>
            <p className="text-xs text-gray-400">Click to add your degrees, certifications, or relevant coursework</p>
          </div>
        )}
        {items.map((edu: EducationItem, idx: number) => (
          <div key={idx} className="group relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <ResumeInlineEditable 
                    value={edu.degree || ''} 
                    onChange={(v) => onChangeField(idx, 'degree', v)} 
                    placeholder="Bachelor of Science" 
                    className="font-semibold text-gray-900 text-base hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                  />
                  <span className="text-gray-400 text-sm">in</span>
                  <ResumeInlineEditable 
                    value={edu.field || ''} 
                    onChange={(v) => onChangeField(idx, 'field', v)} 
                    placeholder="Computer Science" 
                    className="font-medium text-gray-800 text-base hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                  />
                </div>
                <div>
                  <ResumeInlineEditable 
                    value={edu.school || ''} 
                    onChange={(v) => onChangeField(idx, 'school', v)} 
                    placeholder="Stanford University" 
                    className="text-gray-600 text-sm hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ResumeInlineEditable 
                      value={edu.startDate || ''} 
                      onChange={(v) => onChangeField(idx, 'startDate', v)} 
                      placeholder="Sep 2018" 
                      className="hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                    />
                    <span className="text-gray-400">–</span>
                    <ResumeInlineEditable 
                      value={edu.endDate || ''} 
                      onChange={(v) => onChangeField(idx, 'endDate', v)} 
                      placeholder="May 2022" 
                      className="hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                    />
                  </div>
                  {edu.gpa && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">GPA:</span>
                      <ResumeInlineEditable 
                        value={edu.gpa || ''} 
                        onChange={(v) => onChangeField(idx, 'gpa', v)} 
                        placeholder="3.8/4.0" 
                        className="font-medium hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-red-50 text-red-500" 
                onClick={() => onRemoveItem(idx)} 
                aria-label="Remove education"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {idx < items.length - 1 && (
              <div className="mt-5 h-px bg-gray-100" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default EducationSection
