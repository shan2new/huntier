import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/resume/SectionHeader'
import { InlineEditable } from '@/components/resume/InlineEditable'
import { Link, Plus, Trash2 } from 'lucide-react'

export type ProjectItem = {
  name?: string
  url?: string
  description?: string
  highlights?: Array<string>
  technologies?: Array<string>
}

type ProjectsSectionProps = {
  items: Array<ProjectItem>
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onChangeField: (index: number, field: keyof ProjectItem, value: string) => void
  onAddHighlight: (index: number) => void
  onRemoveHighlight: (index: number, highlightIndex: number) => void
  onChangeHighlight: (index: number, highlightIndex: number, text: string) => void
}

export function ProjectsSection({
  items,
  onAddItem,
  onRemoveItem,
  onChangeField,
  onAddHighlight,
  onRemoveHighlight,
  onChangeHighlight,
}: ProjectsSectionProps) {
  return (
    <div>
      <SectionHeader
        title="Projects"
        right={(
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddItem}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Project
          </Button>
        )}
      />
      <div>
        {items.length === 0 && (
          <div
            className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer group"
            onClick={onAddItem}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3 group-hover:bg-gray-200 transition-colors">
              <Link className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Add a project</p>
            <p className="text-sm text-gray-500">Showcase impact, outcomes, and technologies used</p>
          </div>
        )}
        {items.map((p: ProjectItem, idx: number) => (
          <div key={idx} className="group relative pr-5 py-5 rounded-lg hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline text-base gap-2">
                  <InlineEditable
                    value={p.name || ''}
                    onChange={(v) => onChangeField(idx, 'name', v)}
                    placeholder="Project Name"
                    className="font-semibold text-gray-900 hover:bg-gray-100 px-2 py-1 rounded"
                  />
                  <InlineEditable
                    value={p.url || ''}
                    onChange={(v) => onChangeField(idx, 'url', v)}
                    placeholder="https://github.com/…"
                    className="text-sm text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded"
                  />
                </div>
                <InlineEditable
                  value={p.description || ''}
                  onChange={(v) => onChangeField(idx, 'description', v)}
                  placeholder="One-line description and impact"
                  className="text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 -mx-2 -my-1 rounded"
                />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddHighlight(idx)}
                  aria-label="Add highlight"
                  className="h-8 w-8 p-0 hover:bg-gray-200 text-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(idx)}
                  aria-label="Remove project"
                  className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ul className="mt-3 space-y-2.5">
              {(p.highlights || ['']).map((h: string, hIdx: number) => (
                <li key={hIdx} className="group/highlight relative flex items-start gap-3">
                  <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <div className="flex-1 pl-5">
                    <InlineEditable
                      value={h}
                      onChange={(v) => onChangeHighlight(idx, hIdx, v)}
                      placeholder="Quantified accomplishment or detail"
                      className="text-sm leading-relaxed text-gray-700 hover:bg-gray-100 px-2 py-1 -mx-2 -my-1 rounded transition-colors min-h-[1.625rem]"
                      multiline
                    />
                  </div>
                  {(p.highlights || []).length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover/highlight:opacity-100 transition-all duration-200 hover:bg-red-100 text-red-600"
                      onClick={() => onRemoveHighlight(idx, hIdx)}
                      aria-label="Remove highlight"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectsSection



