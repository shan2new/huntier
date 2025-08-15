import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export function CompensationEditor({ app, onSave }: { app: any; onSave: (payload: any) => Promise<void> }) {
  const [fixedMin, setFixedMin] = useState(app?.compensation?.fixed_min_lpa || '')
  const [fixedMax, setFixedMax] = useState(app?.compensation?.fixed_max_lpa || '')
  const [varMin, setVarMin] = useState(app?.compensation?.var_min_lpa || '')
  const [varMax, setVarMax] = useState(app?.compensation?.var_max_lpa || '')
  const [note, setNote] = useState(app?.compensation?.note || '')

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
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-sm font-medium text-foreground">Compensation</div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: numeric fields */}
            <div className="space-y-4">
              {/* Fixed Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fixed Range (LPA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Min"
                    value={fixedMin}
                    onChange={(e) => setFixedMin(e.target.value)}
                    className="bg-background/50 border-border"
                  />
                  <Input
                    placeholder="Max"
                    value={fixedMax}
                    onChange={(e) => setFixedMax(e.target.value)}
                    className="bg-background/50 border-border"
                  />
                </div>
              </div>

              {/* Variable Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Variable Range (LPA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Min"
                    value={varMin}
                    onChange={(e) => setVarMin(e.target.value)}
                    className="bg-background/50 border-border"
                  />
                  <Input
                    placeholder="Max"
                    value={varMax}
                    onChange={(e) => setVarMax(e.target.value)}
                    className="bg-background/50 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Right: notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Additional Notes</label>
              <Textarea 
                placeholder="Any additional compensation details, benefits, equity, etc."
                value={note} 
                onChange={(e) => setNote(e.target.value)}
                className="bg-background/50 border-border min-h-[120px]"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


