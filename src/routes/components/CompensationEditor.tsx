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
      <Card className="border border-border">
        <CardContent className="p-6">
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
                    onChange={(e) => {
                      const v = e.target.value
                      setFixedMin(v)
                      const asNum = v ? Number(v) : 0
                      if (fixedMax && asNum > Number(fixedMax)) setFixedMax(String(asNum))
                    }}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                  <Input
                    placeholder="Max"
                    value={fixedMax}
                    onChange={(e) => {
                      const v = e.target.value
                      setFixedMax(v)
                      const asNum = v ? Number(v) : 0
                      if (fixedMin && asNum < Number(fixedMin)) setFixedMin(String(asNum))
                    }}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                {/* Dual slider */}
                <div className="relative h-8 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={fixedMin ? Number(fixedMin) : 0}
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), fixedMax ? Number(fixedMax) : 100)
                      setFixedMin(String(v))
                    }}
                    className="absolute inset-x-0 h-1 w-full appearance-none bg-border rounded"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={fixedMax ? Number(fixedMax) : 0}
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), fixedMin ? Number(fixedMin) : 0)
                      setFixedMax(String(v))
                    }}
                    className="absolute inset-x-0 h-1 w-full appearance-none bg-transparent"
                  />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Fixed Min (LPA)</label>
                  <Input 
                    placeholder="e.g. 25" 
                    value={fixedMin} 
                    onChange={(e) => setFixedMin(e.target.value)}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Fixed Max (LPA)</label>
                  <Input 
                    placeholder="e.g. 30" 
                    value={fixedMax} 
                    onChange={(e) => setFixedMax(e.target.value)}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Variable Min (LPA)</label>
                  <Input 
                    placeholder="e.g. 5" 
                    value={varMin} 
                    onChange={(e) => setVarMin(e.target.value)}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Variable Max (LPA)</label>
                  <Input 
                    placeholder="e.g. 10" 
                    value={varMax} 
                    onChange={(e) => setVarMax(e.target.value)}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
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
                    onChange={(e) => {
                      const v = e.target.value
                      setVarMin(v)
                      const asNum = v ? Number(v) : 0
                      if (varMax && asNum > Number(varMax)) setVarMax(String(asNum))
                    }}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                  <Input
                    placeholder="Max"
                    value={varMax}
                    onChange={(e) => {
                      const v = e.target.value
                      setVarMax(v)
                      const asNum = v ? Number(v) : 0
                      if (varMin && asNum < Number(varMin)) setVarMin(String(asNum))
                    }}
                    className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50"
                  />
                </div>
                <div className="relative h-8 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={varMin ? Number(varMin) : 0}
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), varMax ? Number(varMax) : 100)
                      setVarMin(String(v))
                    }}
                    className="absolute inset-x-0 h-1 w-full appearance-none bg-border rounded"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={varMax ? Number(varMax) : 0}
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), varMin ? Number(varMin) : 0)
                      setVarMax(String(v))
                    }}
                    className="absolute inset-x-0 h-1 w-full appearance-none bg-transparent"
                  />
                </div>
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
                className="bg-background/50 border-zinc-200/50 dark:border-zinc-800/50 min-h-[160px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


