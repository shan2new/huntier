import { useState } from 'react'
import { format } from 'date-fns'
import { Check, CheckCircle2, Clock, Edit3, Trash2, X } from 'lucide-react'
import type { InterviewData, InterviewType } from '@/hooks/useInterviewData'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { interviewTypeLabels, isInterviewType } from '@/hooks/useInterviewData'
import { cn } from '@/lib/utils'

interface InterviewCardProps {
  stepId: string
  label: string
  data?: InterviewData
  isCompleted: boolean
  isActive: boolean
  canDelete: boolean
  onSchedule: (stageId: string, dateTime: Date, type: InterviewType) => Promise<InterviewData | undefined>
  onReschedule: (stageId: string, dateTime: Date) => Promise<InterviewData | undefined>
  onUpdateName: (stageId: string, name: string) => Promise<InterviewData | undefined>
  onUpdateType: (stageId: string, type: InterviewType) => Promise<InterviewData | undefined>
  onDelete?: (stageId: string) => void
  onClick?: () => void
}

export function InterviewCard({
  stepId,
  label,
  data,
  isCompleted,
  isActive,
  canDelete,
  onSchedule,
  onReschedule,
  onUpdateName,
  onUpdateType,
  onDelete,
  onClick
}: InterviewCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [pendingDateTime, setPendingDateTime] = useState<Date | undefined>()
  const [pendingType, setPendingType] = useState<InterviewType | undefined>()

  const scheduledAt = data?.scheduled_at
  const defaultType: InterviewType = pendingType ?? data?.type ?? 'dsa'

  const handleStartEdit = () => {
    setEditMode(true)
    handleStartNameEdit();
    if (data) {
      setPendingType(data.type)
    }
  }

  const handleStartNameEdit = () => {
    setEditName(data?.custom_name || label)
    setEditingName(true)
  }

  const handleSaveChanges = async () => {
    try {
      const dateTime = pendingDateTime
      const newType = pendingType
      
      if (dateTime || newType !== undefined) {
        if (data && data.id) {
          // Update type if changed
          if (newType !== undefined && newType !== data.type) {
            await onUpdateType(stepId, newType)
          }
          // Apply schedule/reschedule if date changed or added
          if (dateTime) {
            await onReschedule(stepId, dateTime)
          }
        } else if (dateTime && newType) {
          await onSchedule(stepId, dateTime, newType)
        }
      }
      
      handleCancelChanges()
    } catch (error) {
      console.error('Error saving changes:', error)
    }
  }

  const handleCancelChanges = () => {
    setPendingDateTime(undefined)
    setPendingType(undefined)
    setEditMode(false)
    handleCancelNameEdit()
  }

  const handleSaveName = async () => {
    if (editName.trim()) {
      try {
        await onUpdateName(stepId, editName.trim())
        setEditingName(false)
      } catch (error) {
        console.error('Failed to update interview name:', error)
      }
    }
  }

  const handleCancelNameEdit = () => {
    setEditingName(false)
    setEditName('')
  }

  return (
    <div 
      className="relative flex justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "hover:shadow-sm transition-all w-60 rounded-md relative z-10 group",
          isCompleted && "bg-primary/5 border-primary/20 hover:bg-primary/10",
          isActive && "bg-yellow-500/20 border-yellow-500/30 shadow-sm animate-pulse hover:bg-yellow-500/30",
          !isCompleted && !isActive && "bg-muted/30 border-border hover:bg-muted/50",
          !editMode && "cursor-pointer"
        )}
        onClick={!editMode ? onClick : undefined}
      >
        <CardContent className="px-3 py-2 relative">
          {/* CheckCircle for completed interviews - vertically centered */}
          {isCompleted && (
            <CheckCircle2 className="absolute top-1/2 left-2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
          )}
          <div className="space-y-2">
            {/* Interview name and edit icon */}
            <div className="flex items-center justify-center gap-1">
              {editingName ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') handleCancelNameEdit()
                  }}
                  className="h-7 text-sm bg-transparent shadow-none border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                  autoFocus
                />
              ) : (
                <>
                  <h3 className={cn(
                    "text-sm font-medium transition-colors group-hover:text-foreground/80",
                    isCompleted ? "text-primary-foreground" : "text-foreground",
                    isCompleted && "pl-2" // Add left padding when completed to account for CheckCircle
                  )}>
                    {data?.custom_name || label}
                  </h3>
                  
                  {/* Edit icon - only visible on hover and not in edit mode */}
                  {isHovered && !editMode && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-background/80 hover:bg-background border shadow-sm transition-all z-20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit()
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Type badge - clickable in edit mode */}
            <div className="flex items-center justify-center gap-2">
              {editMode ? (
                <Select
                  value={pendingType || defaultType}
                  onValueChange={(val) => {
                    if (isInterviewType(val)) {
                      setPendingType(val)
                    }
                  }}
                >
                  <SelectTrigger size="xs" hideIcon={true} className="text-xs px-2 py-2 rounded-md bg-muted text-muted-foreground border-none shadow-none hover:bg-muted/80 font-normal">
                    <SelectValue className="font-normal text-xs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Interview Type</SelectLabel>
                      {Object.entries(interviewTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                  {interviewTypeLabels[defaultType]}
                </div>
              )}
            </div>

            {/* Date/time - clickable in edit mode */}
            {editMode ? (
              <div className="space-y-2">
                <DateTimePicker
                  value={pendingDateTime ?? (scheduledAt ? new Date(scheduledAt) : undefined)}
                  onChange={(dateTime) => setPendingDateTime(dateTime)}
                  placeholder="Add Schedule"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </div>
            ) : (
              scheduledAt && (
                <div className='flex items-center justify-center'>
                  <div className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground border-none shadow-none hover:bg-muted/80 font-normal flex gap-1 items-center">
                  <Clock className="h-4 w-4" />  {format(new Date(scheduledAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              )
            )}

            {/* Edit mode action buttons */}
            {editMode && (
              <div className="flex items-center justify-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCancelChanges()
                  }}
                >
                  <X />
                </Button>
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSaveChanges()
                  }}
                  disabled={!pendingDateTime && pendingType === undefined}
                >
                  <Check />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete button for interview rounds */}
      {canDelete && editMode && (
        <div className="absolute -right-8 top-1/2 -translate-y-1/2">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(stepId)
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  )
}
