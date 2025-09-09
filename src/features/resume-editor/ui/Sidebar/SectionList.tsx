import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSelector } from 'react-redux'
import { selectResumeOutline } from '../../state/selectors'
import { useResumeEditor } from '../../context/ResumeEditorContext'

export function SectionList() {
  const editor = useResumeEditor()
  const sections = useSelector(selectResumeOutline) as any[]
  return (
    <div className="p-3 space-y-2">
      <div className="text-xs text-muted-foreground px-1">Sections</div>
      <div className="space-y-1">
        {sections.map((s: any, i: number) => (
          <div key={s.id || `${s.type}:${i}`} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-muted/50">
            <span className="truncate">{s.title}</span>
            <span className="text-xs text-muted-foreground">{s.type}</span>
          </div>
        ))}
      </div>
      <Separator className="my-2" />
      <div className="grid grid-cols-2 gap-2">
        {(editor.availableSections || []).map((it: any) => (
          <Button key={it.type} variant="outline" size="sm" onClick={() => editor.addSection(it.type, it.title)}>
            {it.title}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default SectionList


