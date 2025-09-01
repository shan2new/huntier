import { Button } from '@/components/ui/button'
import { ResumeInlineEditable } from '@/components/resume/ResumeInlineEditable'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { Plus, Trash2, Award } from 'lucide-react'

export type CertificationItem = {
  name?: string
  issuer?: string
  date?: string
  description?: string
}

type CertificationsSectionProps = {
  items: Array<CertificationItem>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onChangeField: (index: number, field: keyof CertificationItem, value: string) => void
}

export function CertificationsSection({
  items,
  onAddItem,
  onRemoveItem,
  onChangeField,
}: CertificationsSectionProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Certifications"
        right={(
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddItem}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Certification
          </Button>
        )}
      />
      <div className="space-y-4">
        {items.length === 0 && (
          <div
            className="text-center py-8 border border-gray-200 rounded-md hover:border-gray-300 transition-all cursor-pointer group bg-gray-50/30"
            onClick={onAddItem}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-3 group-hover:shadow-sm transition-all border border-gray-200">
              <Award className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm mb-1">Add your certifications</p>
            <p className="text-xs text-gray-400">Include certificate name, issuer, and date</p>
          </div>
        )}
        {items.map((cert: CertificationItem, idx: number) => (
          <div key={idx} className="group relative">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-colors" />
              </div>
              <div className="flex-1 -mt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-3 flex-wrap">
                      <ResumeInlineEditable
                        value={cert.name || ''}
                        onChange={(v) => onChangeField(idx, 'name', v)}
                        placeholder="AWS Certified Solutions Architect"
                        className="font-semibold text-gray-900 text-base hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors flex-1"
                      />
                      {cert.issuer !== undefined && (
                        <ResumeInlineEditable
                          value={cert.issuer || ''}
                          onChange={(v) => onChangeField(idx, 'issuer', v)}
                          placeholder="Amazon Web Services"
                          className="text-sm text-gray-600 hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                        />
                      )}
                      {cert.date !== undefined && (
                        <ResumeInlineEditable
                          value={cert.date || ''}
                          onChange={(v) => onChangeField(idx, 'date', v)}
                          placeholder="2024"
                          className="text-sm text-gray-500 hover:bg-blue-50/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded transition-colors"
                        />
                      )}
                    </div>
                    {cert.description !== undefined && (
                      <ResumeInlineEditable
                        value={cert.description || ''}
                        onChange={(v) => onChangeField(idx, 'description', v)}
                        placeholder="Validated expertise in designing and deploying scalable systems on AWS"
                        className="text-sm text-gray-600 leading-relaxed hover:bg-blue-50/50 px-1.5 py-1 -mx-1.5 -my-1 rounded transition-colors block"
                        multiline
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 hover:bg-red-50 text-red-500 flex-shrink-0"
                    onClick={() => onRemoveItem(idx)}
                    aria-label="Remove certification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CertificationsSection


