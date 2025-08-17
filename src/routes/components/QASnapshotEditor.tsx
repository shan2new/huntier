import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
 

export function QASnapshotEditor({ app, onSave }: { app: any, onSave: (payload: any) => Promise<void> }) {
  const [value, setValue] = useState(app?.qa_snapshot || '')
 
  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">Recruiter Q&A</h3>
          </div>
          <Button onClick={() => onSave(value)} size="sm">Save</Button>
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          className="w-full px-3 py-2"
          placeholder="Write your prepared responses here"
        />
      </CardContent>
    </Card>
  )
}


