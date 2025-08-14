import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'


export function CompensationEditor({ app, onSave }: { app: any; onSave: (payload: any) => Promise<void> }) {
  const [fixedMin, setFixedMin] = useState(app?.compensation?.fixed_min_lpa || '')
  const [fixedMax, setFixedMax] = useState(app?.compensation?.fixed_max_lpa || '')
  const [varMin, setVarMin] = useState(app?.compensation?.var_min_lpa || '')
  const [varMax, setVarMax] = useState(app?.compensation?.var_max_lpa || '')
  const [note, setNote] = useState(app?.compensation?.tentative_ctc_note || '')

  // Auto-save when any field changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (app) {
        onSave({
          fixed_min_lpa: fixedMin ? Number(fixedMin) : null,
          fixed_max_lpa: fixedMax ? Number(fixedMax) : null,
          var_min_lpa: varMin ? Number(varMin) : null,
          var_max_lpa: varMax ? Number(varMax) : null,
          note: note || null,
        })
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [fixedMin, fixedMax, varMin, varMax, note, app, onSave])
  
  return (
    <div className="space-y-6">
      <Card className="glass border-border/20 shadow-soft">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Fixed Min (LPA)</label>
              <Input 
                placeholder="e.g. 25" 
                value={fixedMin} 
                onChange={(e) => setFixedMin(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Fixed Max (LPA)</label>
              <Input 
                placeholder="e.g. 30" 
                value={fixedMax} 
                onChange={(e) => setFixedMax(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Variable Min (LPA)</label>
              <Input 
                placeholder="e.g. 5" 
                value={varMin} 
                onChange={(e) => setVarMin(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Variable Max (LPA)</label>
              <Input 
                placeholder="e.g. 10" 
                value={varMax} 
                onChange={(e) => setVarMax(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Additional Notes</label>
            <Textarea 
              placeholder="Any additional compensation details, benefits, equity, etc."
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              className="bg-background/50 border-border/50 min-h-[80px]"
            />
          </div>
          

        </CardContent>
      </Card>
    </div>
  )
}


