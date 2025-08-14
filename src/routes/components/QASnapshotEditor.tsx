import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Save } from 'lucide-react'

const fieldLabels = {
  current_ctc_text: 'Current CTC',
  expected_ctc_text: 'Expected CTC',
  notice_period_text: 'Notice Period',
  reason_leaving_current_text: 'Reason for Leaving Current Role',
  past_leaving_reasons_text: 'Past Job Changes',
}

export function QASnapshotEditor({ app, onSave }: { app: any; onSave: (payload: any) => Promise<void> }) {
  const [state, setState] = useState({
    current_ctc_text: app?.qa_snapshot?.current_ctc_text || '',
    expected_ctc_text: app?.qa_snapshot?.expected_ctc_text || '',
    notice_period_text: app?.qa_snapshot?.notice_period_text || '',
    reason_leaving_current_text: app?.qa_snapshot?.reason_leaving_current_text || '',
    past_leaving_reasons_text: app?.qa_snapshot?.past_leaving_reasons_text || '',
  })
  
  return (
    <Card className="glass border-border/20 shadow-soft">
      <CardContent className="p-6 space-y-6">
        {Object.entries(state).map(([k, v]) => (
          <div key={k} className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {fieldLabels[k as keyof typeof fieldLabels] || k}
            </label>
            <Textarea 
              className="bg-background/50 border-border/50 min-h-[60px]"
              value={v as string} 
              onChange={(e) => setState({ ...state, [k]: e.target.value })}
              placeholder={`Enter ${fieldLabels[k as keyof typeof fieldLabels]?.toLowerCase() || k}...`}
            />
          </div>
        ))}
        
        <div className="flex justify-end pt-2">
          <Button 
            onClick={() => onSave(state)}
            className="shadow-soft"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


