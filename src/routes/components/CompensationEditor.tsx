import { useEffect, useState } from 'react'
import { DollarSign, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function CompensationEditor({ app, onSave }: { app: any; onSave: (payload: any) => Promise<void> }) {
  const [compensationType, setCompensationType] = useState<'fixed' | 'range' | 'variable'>(
    app?.compensation?.fixed_min_lpa && app?.compensation?.fixed_max_lpa && app?.compensation?.fixed_min_lpa === app?.compensation?.fixed_max_lpa 
      ? 'fixed' 
      : app?.compensation?.var_min_lpa || app?.compensation?.var_max_lpa 
        ? 'variable' 
        : 'range'
  )
  const [fixedAmount, setFixedAmount] = useState(app?.compensation?.fixed_min_lpa || '')
  const [rangeMin, setRangeMin] = useState(app?.compensation?.fixed_min_lpa || '')
  const [rangeMax, setRangeMax] = useState(app?.compensation?.fixed_max_lpa || '')
  const [variableAmount, setVariableAmount] = useState(app?.compensation?.var_min_lpa || '')
  const [note, setNote] = useState(app?.compensation?.note || '')

  // Auto-save when any field changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (app) {
        const payload: any = { note: note || null }
        
        if (compensationType === 'fixed') {
          payload.fixed_min_lpa = fixedAmount ? Number(fixedAmount) : null
          payload.fixed_max_lpa = fixedAmount ? Number(fixedAmount) : null
          payload.var_min_lpa = null
          payload.var_max_lpa = null
        } else if (compensationType === 'range') {
          payload.fixed_min_lpa = rangeMin ? Number(rangeMin) : null
          payload.fixed_max_lpa = rangeMax ? Number(rangeMax) : null
          payload.var_min_lpa = null
          payload.var_max_lpa = null
        } else if (compensationType === 'variable') {
          payload.fixed_min_lpa = null
          payload.fixed_max_lpa = null
          payload.var_min_lpa = variableAmount ? Number(variableAmount) : null
          payload.var_max_lpa = variableAmount ? Number(variableAmount) : null
        }
        
        onSave(payload)
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [compensationType, fixedAmount, rangeMin, rangeMax, variableAmount, note, app, onSave])

  const getDisplayValue = () => {
    if (compensationType === 'fixed' && fixedAmount) {
      return `₹${fixedAmount} LPA`
    } else if (compensationType === 'range' && rangeMin && rangeMax) {
      return `₹${rangeMin} - ₹${rangeMax} LPA`
    } else if (compensationType === 'variable' && variableAmount) {
      return `₹${variableAmount} LPA (Variable)`
    }
    return 'Not specified'
  }
  
  return (
    <Card className="border border-border">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium text-foreground">Compensation</div>
          </div>
          
          {/* Type Selection */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Compensation Type</div>
            <div className="flex gap-2">
              <Button
                variant={compensationType === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompensationType('fixed')}
                className="flex-1"
              >
                Fixed Amount
              </Button>
              <Button
                variant={compensationType === 'range' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompensationType('range')}
                className="flex-1"
              >
                Range
              </Button>
              <Button
                variant={compensationType === 'variable' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCompensationType('variable')}
                className="flex-1"
              >
                Variable
              </Button>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            {compensationType === 'fixed' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Fixed Amount (LPA)</label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  step="0.5"
                  placeholder="e.g., 15.5"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="bg-background/50 rounded-xl border-border"
                />
              </div>
            )}

            {compensationType === 'range' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Range (LPA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    step="0.5"
                    placeholder="Min"
                    value={rangeMin}
                    onChange={(e) => setRangeMin(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                  <Input
                    type="number"
                    min={rangeMin ? Number(rangeMin) : 0}
                    max={200}
                    step="0.5"
                    placeholder="Max"
                    value={rangeMax}
                    onChange={(e) => setRangeMax(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                </div>
              </div>
            )}

            {compensationType === 'variable' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Variable Amount (LPA)</label>
                <Input
                  type="number"
                  min={0}
                  max={200}
                  step="0.5"
                  placeholder="e.g., 8.5"
                  value={variableAmount}
                  onChange={(e) => setVariableAmount(e.target.value)}
                  className="bg-background/50 rounded-xl border-border"
                />
              </div>
            )}
          </div>

          {/* Current Display */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Current: {getDisplayValue()}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Additional Notes</label>
            <Textarea 
              placeholder="Any additional compensation details, benefits, equity, etc."
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              className="bg-background/50 rounded-xl border-border min-h-[80px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


