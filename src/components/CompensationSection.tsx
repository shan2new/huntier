import { useState } from "react"
import { HelpCircle, Wallet2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
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
  variableEnabled?: boolean
  setVariableEnabled?: (v: boolean) => void
}



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
  variant = 'default',
  variableEnabled,
  setVariableEnabled,
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

  const hasFixedComp = fixedMinLpa || fixedMaxLpa
  const hasVarComp = varMinLpa || varMaxLpa
  const variableOn = typeof variableEnabled === 'boolean' ? variableEnabled : !!hasVarComp
  const fixedRangeValid = validateRange(fixedMinLpa, fixedMaxLpa)
  const varRangeValid = validateRange(varMinLpa, varMaxLpa)

  return (
    <TooltipProvider>
      <Card className={cn("bg-card/80 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200", className)}>
        <CardContent className={cn("space-y-4", isCompact ? "pt-3" : "py-4")}>
          {/* Header */}
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2 text-card-foreground">
              <Wallet2 className="h-4 w-4 text-primary" />
              Compensation
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary/80 transition-colors" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56 text-xs">Set the expected salary range for this role. Include both fixed and variable components if applicable.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Fixed Compensation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-card-foreground">Base Salary</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help hover:text-primary/80 transition-colors" />
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
                    "text-center transition-all duration-200 bg-background border-border/60 focus:border-primary/60",
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
                    "text-center transition-all duration-200 bg-background border-border/60 focus:border-primary/60",
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-card-foreground">Variable/Bonus</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help hover:text-primary/80 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-48 text-xs">Performance-based bonus, equity, or commission in Lakhs per annum</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-variable-comp"
                  checked={variableOn}
                  onCheckedChange={(v) => {
                    const next = !!v
                    if (typeof setVariableEnabled === 'function') setVariableEnabled(next)
                    if (!next) {
                      setVarMinLpa('')
                      setVarMaxLpa('')
                    }
                  }}
                />
                <Label htmlFor="include-variable-comp" className="text-xs text-muted-foreground">Include</Label>
              </div>
            </div>

            {variableOn && (
              <>
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
                        "text-center transition-all duration-200 bg-background border-border/60 focus:border-primary/60",
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
                        "text-center transition-all duration-200 bg-background border-border/60 focus:border-primary/60",
                        activeField === 'varMax' && "border-primary/60 bg-primary/5 shadow-sm",
                        !varRangeValid && varMinLpa && varMaxLpa && "border-destructive"
                      )}
                    />
                  </div>
                </div>

                {!varRangeValid && varMinLpa && varMaxLpa && (
                  <p className="text-xs text-destructive">Maximum should be greater than or equal to minimum</p>
                )}
              </>
            )}
          </div>

          {/* Total Compensation Display */}
          {(hasFixedComp || hasVarComp) && (
            <div className="pt-2 border-t border-border/60">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Range</span>
                <span className="font-medium text-card-foreground">
                  {(() => {
                    const fixedMin = parseFloat(fixedMinLpa) || 0
                    const fixedMax = parseFloat(fixedMaxLpa) || 0
                    const varMin = variableOn ? (parseFloat(varMinLpa) || 0) : 0
                    const varMax = variableOn ? (parseFloat(varMaxLpa) || 0) : 0
                    
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
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
