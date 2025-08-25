import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface StageCardProps {
  stepId: string
  label: string
  isCompleted: boolean
  isActive: boolean
  isEditable?: boolean
  editMode?: boolean
  currentStage?: { id: string; name: string }
  onLabelChange?: (stageId: string, newLabel: string) => void
  onClick?: () => void
}

export function StageCard({
  stepId,
  label,
  isCompleted,
  isActive,
  isEditable = false,
  editMode = false,
  currentStage,
  onLabelChange,
  onClick
}: StageCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = () => {
    setEditValue(label)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editValue.trim() && onLabelChange) {
      onLabelChange(stepId, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  return (
    <div className="relative flex justify-center">
      <Card className={cn(
        "hover:shadow-sm transition-all w-60 rounded-md relative z-10 group cursor-pointer",
        isCompleted && "bg-primary/5 border-primary/20 hover:bg-primary/10",
        isActive && "bg-yellow-500/20 border-yellow-500/30 shadow-sm animate-pulse hover:bg-yellow-500/30",
        !isCompleted && !isActive && "bg-muted/30 border-border hover:bg-muted/50"
      )} onClick={onClick}>
        <CardContent className="px-3 py-2 relative">
          {/* CheckCircle for completed stages - vertically centered */}
          {isCompleted && (
            <CheckCircle2 className="absolute top-1/2 left-2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
          )}
          
          <div className="flex items-center justify-center">
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="h-7 text-sm bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                autoFocus
              />
            ) : (
              <div 
                className={cn(
                  "text-sm font-medium transition-colors group-hover:text-foreground/80",
                  isCompleted ? "text-primary-foreground" : "text-foreground",
                  isEditable && editMode && "cursor-pointer hover:text-primary",
                  isCompleted && "pl-2" // Add left padding when completed to account for CheckCircle
                )}
                onClick={(e) => {
                  if (isEditable && editMode) {
                    e.stopPropagation()
                    handleStartEdit()
                  }
                }}
              >
                {label}
              </div>
            )}
          </div>
          
          {isActive && currentStage && ['rejected', 'withdrawn'].includes(currentStage.id) && (
            <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
              {currentStage.id === 'rejected' && 'Application Rejected'}
              {currentStage.id === 'withdrawn' && 'Application Withdrawn'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
