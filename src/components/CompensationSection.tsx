import { useState } from "react"
import { DollarSign, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CompensationSectionProps {
  fixedMinLpa: string
  fixedMaxLpa: string
  varMinLpa: string
  varMaxLpa: string
  setFixedMinLpa: (v: string) => void
  setFixedMaxLpa: (v: string) => void
  setVarMinLpa: (v: string) => void
  setVarMaxLpa: (v: string) => void
  className?: string
  variant?: 'default' | 'compact'
}

const PRESET_RANGES = [
  { label: '8-12L', fixed: { min: '8', max: '12' } },
  { label: '15-25L', fixed: { min: '15', max: '25' } },
  { label: '25-35L', fixed: { min: '25', max: '35' } },
  { label: '35-50L', fixed: { min: '35', max: '50' } },
  { label: '50-75L', fixed: { min: '50', max: '75' } },
  { label: '75L+', fixed: { min: '75', max: '100' } },
]

export function CompensationSection({
  fixedMinLpa,
  fixedMaxLpa,
  varMinLpa,
  varMaxLpa,
  setFixedMinLpa,
  setFixedMaxLpa,
  setVarMinLpa,
  setVarMaxLpa,
  className,
  variant = 'default'
}: CompensationSectionProps) {
  const [activeField, setActiveField] = useState<string | null>(null)
  
  const isCompact = variant === 'compact'

  // Validation helpers
  const validateRange = (min: string, max: string) => {
    if (!min || !max) return true
    const minNum = parseFloat(min)
    const maxNum = parseFloat(max)
    return !isNaN(minNum) && !isNaN(maxNum) && minNum <= maxNum
  }


  const handleNumberInput = (value: string, setter: (v: string) => void) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value)
    }
  }

  const applyPreset = (preset: typeof PRESET_RANGES[0]) => {
    setFixedMinLpa(preset.fixed.min)
    setFixedMaxLpa(preset.fixed.max)
  }

  const hasFixedComp = fixedMinLpa || fixedMaxLpa
  const hasVarComp = varMinLpa || varMaxLpa
  const fixedRangeValid = validateRange(fixedMinLpa, fixedMaxLpa)
  const varRangeValid = validateRange(varMinLpa, varMaxLpa)

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardContent className={cn("space-y-4", isCompact ? "pt-3" : "py-4")}>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Compensation
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56 text-xs">Set the expected salary range for this role. Include both fixed and variable components if applicable.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Fixed Compensation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Base Salary</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-48 text-xs">Fixed annual salary component in Lakhs per annum</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className={cn("grid gap-2", isCompact ? "grid-cols-2" : "grid-cols-2")}>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  value={fixedMinLpa}
                  onChange={(e) => handleNumberInput(e.target.value, setFixedMinLpa)}
                  onFocus={() => setActiveField('fixedMin')}
                  onBlur={() => setActiveField(null)}
                  placeholder="15"
                  className={cn(
                    "text-center transition-all duration-200",
                    activeField === 'fixedMin' && "border-primary/60 bg-primary/5 shadow-sm",
                    !fixedRangeValid && fixedMinLpa && fixedMaxLpa && "border-destructive"
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  value={fixedMaxLpa}
                  onChange={(e) => handleNumberInput(e.target.value, setFixedMaxLpa)}
                  onFocus={() => setActiveField('fixedMax')}
                  onBlur={() => setActiveField(null)}
                  placeholder="25"
                  className={cn(
                    "text-center transition-all duration-200",
                    activeField === 'fixedMax' && "border-primary/60 bg-primary/5 shadow-sm",
                    !fixedRangeValid && fixedMinLpa && fixedMaxLpa && "border-destructive"
                  )}
                />
              </div>
            </div>

            {!fixedRangeValid && fixedMinLpa && fixedMaxLpa && (
              <p className="text-xs text-destructive">Maximum should be greater than or equal to minimum</p>
            )}
          </div>

          {/* Variable Compensation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Variable/Bonus</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-48 text-xs">Performance-based bonus, equity, or commission in Lakhs per annum</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className={cn("grid gap-2", isCompact ? "grid-cols-2" : "grid-cols-2")}>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <Input
                  value={varMinLpa}
                  onChange={(e) => handleNumberInput(e.target.value, setVarMinLpa)}
                  onFocus={() => setActiveField('varMin')}
                  onBlur={() => setActiveField(null)}
                  placeholder="5"
                  className={cn(
                    "text-center transition-all duration-200",
                    activeField === 'varMin' && "border-primary/60 bg-primary/5 shadow-sm",
                    !varRangeValid && varMinLpa && varMaxLpa && "border-destructive"
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Maximum</Label>
                <Input
                  value={varMaxLpa}
                  onChange={(e) => handleNumberInput(e.target.value, setVarMaxLpa)}
                  onFocus={() => setActiveField('varMax')}
                  onBlur={() => setActiveField(null)}
                  placeholder="10"
                  className={cn(
                    "text-center transition-all duration-200",
                    activeField === 'varMax' && "border-primary/60 bg-primary/5 shadow-sm",
                    !varRangeValid && varMinLpa && varMaxLpa && "border-destructive"
                  )}
                />
              </div>
            </div>

            {!varRangeValid && varMinLpa && varMaxLpa && (
              <p className="text-xs text-destructive">Maximum should be greater than or equal to minimum</p>
            )}
          </div>

          {/* Total Compensation Display */}
          {(hasFixedComp || hasVarComp) && (
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Range</span>
                <span className="font-medium">
                  {(() => {
                    const fixedMin = parseFloat(fixedMinLpa) || 0
                    const fixedMax = parseFloat(fixedMaxLpa) || 0
                    const varMin = parseFloat(varMinLpa) || 0
                    const varMax = parseFloat(varMaxLpa) || 0
                    
                    const totalMin = fixedMin + varMin
                    const totalMax = fixedMax + varMax
                    
                    if (totalMin === totalMax && totalMin > 0) {
                      return `₹${totalMin}L`
                    } else if (totalMin > 0 && totalMax > 0) {
                      return `₹${totalMin}L - ₹${totalMax}L`
                    } else {
                      return 'Not specified'
                    }
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Quick presets */}
          {(hasFixedComp || hasVarComp) ? null : (
            <div className="flex gap-1 flex-wrap">
              <div className="text-xs text-muted-foreground mb-2">Quick presets:</div>
              <div className="flex gap-1 flex-wrap">
                {PRESET_RANGES.slice(0, isCompact ? 3 : 6).map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
