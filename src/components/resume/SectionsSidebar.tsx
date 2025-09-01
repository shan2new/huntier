import { useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, Code2, FileText, GraduationCap, GripVertical, Minus, Plus, SquareStack, Trophy, Users, Award } from 'lucide-react'

type Section = {
  id: string
  type: string
  title: string
  order: number
}

type SectionMeta = { type: string; title: string; icon?: React.ReactNode }

type SectionsSidebarProps = {
  sections: Array<Section>
  availableSections: Array<SectionMeta>
  onAddSection: (type: string, title: string) => void
  onRemoveSection: (type: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onScrollTo?: (type: string) => void
}

const iconForType: Record<string, React.ReactNode> = {
  summary: <FileText className="h-4 w-4" />,
  experience: <Briefcase className="h-4 w-4" />,
  skills: <Code2 className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  achievements: <Trophy className="h-4 w-4" />,
  leadership: <Users className="h-4 w-4" />,
  certifications: <Award className="h-4 w-4" />,
}

export function SectionsSidebar({
  sections,
  availableSections,
  onAddSection,
  onRemoveSection,
  onReorder,
  onScrollTo,
}: SectionsSidebarProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const overIndexRef = useRef<number | null>(null)
  const [activeType, setActiveType] = useState<string>('summary')

  const added = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  )

  const existingTypes = useMemo(() => new Set(added.map((s) => s.type)), [added])
  const more = useMemo(
    () => availableSections.filter((s) => !existingTypes.has(s.type)),
    [availableSections, existingTypes]
  )

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index)
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    overIndexRef.current = index
  }

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragIndex ?? Number(e.dataTransfer.getData('text/plain'))
    const to = overIndexRef.current ?? index
    setDragIndex(null)
    overIndexRef.current = null
    if (Number.isFinite(from) && Number.isFinite(to) && from !== to) {
      onReorder(from, to)
    }
  }

  // Track active section while scrolling the continuous page
  useEffect(() => {
    const handler = () => {
      const sectionEls = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
      if (sectionEls.length === 0) return
      let bestDist = Number.POSITIVE_INFINITY
      let next: string = added[0]?.type || 'summary'
      sectionEls.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const dist = Math.abs(rect.top - 100)
        const type = el.dataset.section || ''
        if (type && dist < bestDist) {
          bestDist = dist
          next = type
        }
      })
      if (next !== activeType) setActiveType(next)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [activeType, added])

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4 slide-in-left sections-sidebar">
      <div className="flex items-baseline gap-2 mb-3">
        <SquareStack className="w-4 h-4" />
        <h3 className="text-sm font-medium text-card-foreground">Sections</h3>    
      </div>

      <div className="space-y-6">
        <div>
          <ul className="space-y-2">
            {added.map((s, index) => (
              <li
                key={s.type}
                className={`group flex items-center justify-between rounded-md border border-border bg-background px-2 py-2 transition-all sections-sidebar-item ${dragIndex === index ? 'opacity-60' : ''} ${activeType === s.type ? 'bg-muted/50 border-primary' : ''}`}
                draggable={s.type !== 'summary'}
                onDragStart={s.type !== 'summary' ? handleDragStart(index) : undefined}
                onDragOver={s.type !== 'summary' ? handleDragOver(index) : undefined}
                onDrop={s.type !== 'summary' ? handleDrop(index) : undefined}
              >
                <button
                  type="button"
                  onClick={() => onScrollTo?.(s.type)}
                  className={`flex items-center gap-2 text-sm hover:text-card-foreground ${activeType === s.type ? 'text-card-foreground' : 'text-card-foreground/90'}`}
                >
                  <span className="text-muted-foreground">{iconForType[s.type] || <FileText className="h-4 w-4" />}</span>
                  <span className="truncate max-w-[9rem]">{s.title}</span>
                </button>
                <div className="flex items-center gap-1">
                  {s.type !== 'summary' && (
                    <button
                      type="button"
                      className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => onRemoveSection(s.type)}
                      aria-label={`Remove ${s.title}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                  {s.type !== 'summary' && (
                    <span className="ml-1 cursor-grab active:cursor-grabbing text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {more.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">More</div>
            <ul className="space-y-2">
              {more.map((m) => (
                <li
                  key={m.type}
                  className="group flex items-center justify-between rounded-md border border-border bg-background px-2 py-2 transition-all sections-sidebar-item"
                >
                  <div className="flex items-center gap-2 text-sm text-card-foreground/90">
                    <span className="text-muted-foreground">{m.icon ?? iconForType[m.type] ?? <FileText className="h-4 w-4" />}</span>
                    <span className="truncate max-w-[10rem]">{m.title}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => onAddSection(m.type, m.title)}
                    aria-label={`Add ${m.title}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default SectionsSidebar


