import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export function CompensationEditor({ app, onSave }: { app: any; onSave: (payload: any) => Promise<void> }) {
  const [fixedMin, setFixedMin] = useState(app?.compensation?.fixed_min_lpa || '')
  const [fixedMax, setFixedMax] = useState(app?.compensation?.fixed_max_lpa || '')
  const [varMin, setVarMin] = useState(app?.compensation?.var_min_lpa || '')
  const [varMax, setVarMax] = useState(app?.compensation?.var_max_lpa || '')
  const [note, setNote] = useState(app?.compensation?.note || '')

  // Derived numeric values for sliders (fallbacks)
  const fixedMinNum = Number(fixedMin) || 0
  const fixedMaxNum = Number(fixedMax) || fixedMinNum
  const varMinNum = Number(varMin) || 0
  const varMaxNum = Number(varMax) || varMinNum

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
                    type="number"
                    min={0}
                    max={200}
                    step="1"
                    placeholder="Min"
                    value={fixedMin}
                    onChange={(e) => setFixedMin(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                  <Input
                    type="number"
                    min={fixedMin ? Number(fixedMin) : 0}
                    max={200}
                    step="1"
                    placeholder="Max"
                    value={fixedMax}
                    onChange={(e) => setFixedMax(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                </div>
                {/* Sliders */}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={1}
                      value={fixedMinNum}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setFixedMin(String(v))
                        if (!fixedMax || v > Number(fixedMax)) {
                          setFixedMax(String(v))
                        }
                      }}
                      className="w-full"
                    />
                    <span className="text-xs w-12 text-right">{fixedMin || fixedMinNum}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={fixedMinNum}
                      max={200}
                      step={1}
                      value={fixedMaxNum}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setFixedMax(String(v))
                        if (!fixedMin || v < Number(fixedMin)) {
                          setFixedMin(String(v))
                        }
                      }}
                      className="w-full"
                    />
                    <span className="text-xs w-12 text-right">{fixedMax || fixedMaxNum}</span>
                  </div>
                </div>
              </div>

              {/* Variable Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Variable Range (LPA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    step="1"
                    placeholder="Min"
                    value={varMin}
                    onChange={(e) => setVarMin(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                  <Input
                    type="number"
                    min={varMin ? Number(varMin) : 0}
                    max={200}
                    step="1"
                    placeholder="Max"
                    value={varMax}
                    onChange={(e) => setVarMax(e.target.value)}
                    className="bg-background/50 rounded-xl border-border"
                  />
                </div>
                {/* Sliders */}
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={1}
                      value={varMinNum}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setVarMin(String(v))
                        if (!varMax || v > Number(varMax)) {
                          setVarMax(String(v))
                        }
                      }}
                      className="w-full"
                    />
                    <span className="text-xs w-12 text-right">{varMin || varMinNum}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={varMinNum}
                      max={200}
                      step={1}
                      value={varMaxNum}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setVarMax(String(v))
                        if (!varMin || v < Number(varMin)) {
                          setVarMin(String(v))
                        }
                      }}
                      className="w-full"
                    />
                    <span className="text-xs w-12 text-right">{varMax || varMaxNum}</span>
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
                className="bg-background/50 rounded-xl border-border min-h-[120px]"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


