import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Check, Edit3, PlusCircle, Trash2, X } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

import { FireworksBackground } from './animate-ui/backgrounds/fireworks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { listInterviews, rescheduleInterview, scheduleInterview } from '@/lib/api'

interface StageVisualizationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStage?: string
  onStageChange?: (stageId: string) => void
  editMode?: boolean
  applicationId?: string
}

interface InterviewData {
  id: string
  type: string
  custom_name?: string
  status: 'unscheduled' | 'scheduled' | 'rescheduled' | 'completed' | 'rejected' | 'withdrawn'
  scheduled_at?: string
  completed_at?: string
  result?: string
  rejection_reason?: string
}

type Step = { id: string; label: string; editable?: boolean }

// Stage mapping to application status  
const stageToStatusMap: Record<string, string> = {
  'applied': 'exploration',
  'hr_shortlisted': 'hr_shortlist',
  'hm_shortlisted': 'hm_shortlist', 
  'interview_scheduled': 'interview_r1',
  'interview_rescheduled': 'interview_r1',
  'interview_completed': 'interview_r1',
  'offered': 'offer',
  'accepted': 'offer',
  'rejected': 'rejected',
  'withdrawn': 'withdrawn'
}

// Reverse mapping for stage transitions
const statusToStageMap: Record<string, string> = {
  'exploration': 'applied',
  'hr_shortlist': 'hr_shortlisted',
  'hm_shortlist': 'hm_shortlisted',
  'interview_r1': 'interview_scheduled',
  'offer': 'offered'
}

export function StageVisualization({
  open,
  onOpenChange,
  currentStage = 'exploration',
  onStageChange,
  applicationId,
}: StageVisualizationProps) {
  const [interviewRounds, setInterviewRounds] = useState(['interview_r1'])
  const [customStageNames, setCustomStageNames] = useState<Record<string, string>>({})
  const [editingStage, setEditingStage] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [interviewData, setInterviewData] = useState<Record<string, InterviewData>>({})
  const [calendarOpen, setCalendarOpen] = useState<string | null>(null)
  // Removed selectedDateTime as it's no longer used
  const [pendingDateTime, setPendingDateTime] = useState<{ [stepId: string]: Date | undefined }>({})
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  // Fetch interview data when component opens
  useEffect(() => {
    if (open && applicationId) {
      fetchInterviewData()
    }
  }, [open, applicationId])

  const { getToken } = useAuth()

  const fetchInterviewData = async () => {
    try {
      if (!applicationId) return
      
      const token = await getToken()
      if (!token) return
      
      const interviews = await listInterviews<Array<InterviewData>>(token, applicationId)
      const interviewMap: Record<string, InterviewData> = {}
      interviews.forEach((interview, index) => {
        const stageId = `interview_r${index + 1}`
        interviewMap[stageId] = interview
      })
      
      setInterviewData(interviewMap)
    } catch (error) {
      console.error('Failed to fetch interview data:', error)
    }
  }

  const handleScheduleInterview = async (stageId: string, dateTime: Date) => {
    try {
      if (!applicationId) return
      
      const token = await getToken()
      if (!token) return
      
      console.log('Scheduling interview for:', stageId, dateTime)
      
      const newInterview = await scheduleInterview<InterviewData>(token, applicationId, {
        type: 'technical', // This could be made configurable
        scheduled_at: dateTime.toISOString()
      })
      
      setInterviewData(prev => ({
        ...prev,
        [stageId]: newInterview
      }))
    } catch (error) {
      console.error('Failed to schedule interview:', error)
    }
  }

  const handleRescheduleInterview = async (stageId: string, dateTime: Date) => {
    try {
      if (!applicationId) return
      
      const token = await getToken()
      if (!token) return
      
      const interview = interviewData[stageId]
      if (!interview) return
      
      console.log('Rescheduling interview for:', stageId, dateTime)
      
      const updatedInterview = await rescheduleInterview<InterviewData>(token, applicationId, interview.id, {
        scheduled_at: dateTime.toISOString()
      })
      
      setInterviewData(prev => ({
        ...prev,
        [stageId]: updatedInterview
      }))
    } catch (error) {
      console.error('Failed to reschedule interview:', error)
    }
  }

  const handleDateTimeSelect = (dateTime: Date | undefined, stepId: string) => {
    // Store pending change instead of making immediate API call
    console.log('handleDateTimeSelect called with:', dateTime, stepId)
    setPendingDateTime(prev => ({
      ...prev,
      [stepId]: dateTime
    }))
  }

  const handleSaveDateTimeChange = async (stepId: string) => {
    const dateTime = pendingDateTime[stepId]
    console.log('Save button clicked for:', stepId, 'with dateTime:', dateTime)
    console.log('Current pendingDateTime state:', pendingDateTime)
    
    if (dateTime) {
      const interview = interviewData[stepId]
      console.log('Existing interview data:', interview)
      
      try {
        if (interview && interview.scheduled_at) {
          console.log('Rescheduling existing interview')
          await handleRescheduleInterview(stepId, dateTime)
        } else {
          console.log('Scheduling new interview')
          await handleScheduleInterview(stepId, dateTime)
        }
        // Clear pending change
        setPendingDateTime(prev => {
          const newState = { ...prev }
          delete newState[stepId]
          return newState
        })
        setCalendarOpen(null)
        // Refresh data after API call
        await fetchInterviewData()
      } catch (error) {
        console.error('Error saving date/time change:', error)
      }
    } else {
      console.log('No pending dateTime found for stepId:', stepId)
    }
  }

  const handleCancelDateTimeChange = (stepId: string) => {
    setPendingDateTime(prev => {
      const newState = { ...prev }
      delete newState[stepId]
      return newState
    })
    setCalendarOpen(null)
  }


  // Generate dynamic steps based on interview rounds
  const steps = useMemo(() => {
    const baseSteps: Array<Step> = [
      { id: 'exploration', label: customStageNames['exploration'] || 'Exploration' },
      { id: 'hr_shortlist', label: customStageNames['hr_shortlist'] || 'HR Shortlist', editable: true },
      { id: 'hm_shortlist', label: customStageNames['hm_shortlist'] || 'Manager Shortlist', editable: true },
    ]
    
    // Add all interview rounds
    interviewRounds.forEach((roundId, index) => {
      baseSteps.push({
        id: roundId,
        label: customStageNames[roundId] || `Round ${index + 1}`,
        editable: true
      })
    })
    
    baseSteps.push({ id: 'offer', label: customStageNames['offer'] || 'Offer' })
    
    return baseSteps
  }, [interviewRounds, customStageNames])

  // Get initial step based on current stage
  const currentStepIndex = useMemo(() => {
    const mappedStage = stageToStatusMap[currentStage] || currentStage
    const index = steps.findIndex(s => s.id === mappedStage)
    // For 'offered' stage, mark it as completed (not just active)
    if (currentStage === 'offered') {
      return steps.length // This makes all steps completed including offer
    }
    return index !== -1 ? index : 0
  }, [currentStage, steps])

  const handleStageClick = (stageId: string) => {
    // Map UI stage ID to backend stage for transition
    const backendStage = statusToStageMap[stageId] || stageId
    onStageChange?.(backendStage)
  }

  const handleAddInterviewRound = async () => {
    console.log('handleAddInterviewRound called')
    try {
      if (!applicationId) {
        console.error('No applicationId available')
        return
      }
      
      const token = await getToken()
      if (!token) {
        console.error('No token available')
        return
      }
      
      console.log('Creating new interview round, current rounds:', interviewRounds.length)
      
      // Create new unscheduled interview round via API
      const nextRoundNumber = interviewRounds.length + 1
      const newInterview = await scheduleInterview<InterviewData>(token, applicationId, {
        type: `round_${nextRoundNumber}`,
        // Don't set scheduled_at to keep it unscheduled
      })
      
      console.log('API call successful, new interview:', newInterview)
      
      // Update local state
      const newRoundId = `interview_r${nextRoundNumber}`
      console.log('Adding new round ID:', newRoundId)
      setInterviewRounds(prev => {
        const updated = [...prev, newRoundId]
        console.log('Updated interview rounds:', updated)
        return updated
      })
      
      // Refresh interview data
      console.log('Refreshing interview data...')
      await fetchInterviewData()
      console.log('Interview data refreshed')
    } catch (error) {
      console.error('Failed to add interview round:', error)
    }
  }

  const handleDeleteInterviewRound = (roundId: string) => {
    if (interviewRounds.length > 1) {
      setInterviewRounds(prev => prev.filter(id => id !== roundId))
    }
  }

  const handleEditStart = (stageId: string) => {
    const step = steps.find(s => s.id === stageId)
    setEditName(step?.label || '')
    setEditingStage(stageId)
  }

  const handleEditSave = () => {
    if (editName.trim() && editingStage) {
      setCustomStageNames(prev => ({
        ...prev,
        [editingStage]: editName.trim()
      }))
    }
    setEditingStage(null)
  }

  const handleEditCancel = () => {
    setEditingStage(null)
    setEditName('')
  }

  const isOfferStage = () => {
    return stageToStatusMap[currentStage] === 'offer'
  }

  const handleWithdraw = () => onStageChange?.('withdrawn')
  const handleReject = () => onStageChange?.('rejected')
  const handleCompleteAll = () => onStageChange?.('offered')
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col">
      {isOfferStage() &&  <FireworksBackground
      className="absolute inset-0 flex items-center justify-center rounded-xl"
      fireworkSpeed={{ min: 8, max: 16 }}
      fireworkSize={{ min: 4, max: 7 }}
      particleSpeed={{ min: 4, max: 14 }}
      particleSize={{ min: 2, max: 2 }}
    />}
        <DialogHeader className="px-6 pt-2">
          <DialogTitle className="text-lg">Timeline</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="w-full max-w-md mx-auto">
            {/* Vertical stepper */}
            <div className="relative flex flex-col items-center justify-center gap-12 z-0">
              
              {steps.map((step, i) => {
                const isActive = i === currentStepIndex
                const isCompleted = i < currentStepIndex
                const isInterviewRound = step.id.startsWith('interview_r')
                const isLastInterviewRound = isInterviewRound && step.id === interviewRounds[interviewRounds.length - 1]
                const isNextCompleted = i + 1 < currentStepIndex
                
                return (
                  <div 
                    key={step.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    <div className="relative">                                            
                      {/* Edge to next node */}
                      {i < steps.length - 1 && (
                        <div className="absolute left-1/2 translate-x-1 top-full w-0.5 h-12 z-0">
                          {/* Solid edge if both current and next nodes are completed, dashed otherwise */}
                          {isCompleted ? (
                            <div className="w-full h-full border-l-1 border-primary animate-in fade-in zoom-in-y duration-400" />
                          ) : (
                            <div className="w-full h-full border-l-1 border-dashed border-muted-foreground/40 animate-in fade-in zoom-in-y duration-400" />
                          )}
                        </div>
                      )}
                      
                      
                      {/* Main step row */}
                      <div className="flex items-center cursor-pointer" onClick={() => handleStageClick(step.id)}>
                        {/* Step content */}
                        <div className="ml-3 flex-1 relative z-10">
                          {/* Extended hover area that includes card and icon space */}
                          <div 
                            className="relative flex justify-center"
                            onMouseEnter={() => isInterviewRound && setHoveredCard(step.id)}
                            onMouseLeave={() => setHoveredCard(null)}
                          >
                            {/* Invisible hover extension for icons - covers card + gap + icons */}
                            {isInterviewRound && (
                              <div className="absolute left-0 top-0 h-full" style={{ width: '280px' }} />
                            )}
                            <Card className={cn(
                              "hover:shadow-sm transition-shadow w-48 rounded-md relative z-10 group cursor-pointer",
                              isCompleted && "bg-primary/5 border-primary/20",
                              isActive && "bg-yellow-500/20 border-yellow-500/30 shadow-sm animate-pulse",
                              !isCompleted && !isActive && "bg-muted/30 border-border"
                            )}
                            >
                              <CardContent className="px-2 py-1.5 relative">
                              {editingStage === step.id ? (
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave()
                                    if (e.key === 'Escape') handleEditCancel()
                                  }}
                                  className="h-7 text-sm bg-transparent border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className={cn(
                                    "flex-1 flex items-center justify-center relative",
                                  )}>
                                    <div className="flex flex-col items-center justify-center w-full">
                                      <div className="space-y-1">
                                        <div className={cn(
                                          "text-xs font-medium transition-colors",
                                          isCompleted ? "text-white" : "text-foreground"
                                        )}>
                                          {step.id.startsWith('interview_') && interviewData[step.id] && interviewData[step.id].custom_name 
                                            ? interviewData[step.id].custom_name 
                                            : step.label}
                                        </div>
                                        
                                        {/* Show interview status and schedule */}
                                        {step.id.startsWith('interview_') && interviewData[step.id] && (
                                          <div className="space-y-1 mt-1">
                                            {/* Status badge */}
                                            <div className={cn(
                                              "text-xs px-2 py-1 rounded-full text-center font-medium inline-block",
                                              interviewData[step.id].status === 'completed' && "bg-green-100 text-green-800",
                                              interviewData[step.id].status === 'scheduled' && "bg-blue-100 text-blue-800",
                                              interviewData[step.id].status === 'rescheduled' && "bg-yellow-100 text-yellow-800",
                                              interviewData[step.id].status === 'rejected' && "bg-red-100 text-red-800",
                                              interviewData[step.id].status === 'withdrawn' && "bg-gray-100 text-gray-800",
                                              interviewData[step.id].status === 'unscheduled' && "bg-gray-100 text-gray-600"
                                            )}>
                                              {interviewData[step.id].status.replace('_', ' ')}
                                            </div>
                                            
                                            {/* Show scheduled time */}
                                            {interviewData[step.id].scheduled_at && (
                                              <div className="text-xs text-muted-foreground font-medium">
                                                {format(new Date(interviewData[step.id].scheduled_at!), 'MMM d, h:mm a')}
                                              </div>
                                            )}
                                            
                                            {/* Show rejection reason */}
                                            {interviewData[step.id].rejection_reason && (
                                              <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                                {interviewData[step.id].rejection_reason}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {isInterviewRound && interviewRounds.length > 1 && hoveredCard !== step.id && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-destructive opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteInterviewRound(step.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {isActive && ['rejected', 'withdrawn'].includes(currentStage) && (
                                <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                                  {currentStage === 'rejected' && 'Application Rejected'}
                                  {currentStage === 'withdrawn' && 'Application Withdrawn'}
                                </div>
                              )}
                            </CardContent>
                            </Card>
                            
                            {/* External action buttons - positioned absolutely to prevent card shift */}
                            <div className={cn(
                              "absolute left-full top-1/2 -translate-y-1/2 ml-2 flex items-center gap-1 transition-all duration-200 ease-in-out",
                              (editingStage === step.id || (isInterviewRound && hoveredCard === step.id)) 
                                ? "opacity-100 translate-x-0" 
                                : "opacity-0 translate-x-2 pointer-events-none"
                            )} onClick={(e) => e.stopPropagation()}>
                              {editingStage === step.id ? (
                                // Save/Cancel icons when editing
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-green-500/10 hover:border-green-500/50 transition-all cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditSave()
                                    }}
                                  >
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-red-500/10 hover:border-red-500/50 transition-all cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditCancel()
                                    }}
                                  >
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                // Edit/Calendar icons when hovering
                                isInterviewRound && (
                                  <>
                                    {step.editable && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-all cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditStart(step.id)
                                        }}
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                    )}
                                    
                                    {calendarOpen === step.id ? (
                                      // Show DateTimePicker directly when calendar is open
                                      <div className="flex flex-col gap-2 p-2 bg-background border border-border rounded-md shadow-lg">
                                        <DateTimePicker
                                          value={pendingDateTime[step.id] || (interviewData[step.id]?.scheduled_at ? new Date(interviewData[step.id].scheduled_at!) : undefined)}
                                          onChange={(dateTime) => {
                                            console.log('DateTimePicker onChange triggered:', dateTime, step.id)
                                            handleDateTimeSelect(dateTime, step.id)
                                          }}
                                          placeholder="Schedule interview"
                                          disabled={(date) => date < new Date()}
                                        />
                                        <div className="flex gap-1 justify-end">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleCancelDateTimeChange(step.id)
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleSaveDateTimeChange(step.id)
                                            }}
                                            disabled={!pendingDateTime[step.id]}
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      // Show calendar icon when closed
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted transition-all cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCalendarOpen(step.id)
                                          // Calendar icon clicked - just open the picker
                                        }}
                                      >
                                        <Calendar className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Interview button after last interview round */}
                    {isLastInterviewRound && !isOfferStage() && (
                      <div className="relative">
                        {/* Edge to Add Interview button */}
                        <div className="absolute left-1/2 translate-x-1 top-full w-1 h-12 z-0">
                          <div className="w-full h-full border-l-1 border-dashed border-muted-foreground/30" />
                        </div>
                        
                        <div className="mt-12">
                          {/* Add Interview step */}
                          <div className="flex items-center">
                            
                            <div className="ml-3 flex-1 relative z-10" onClick={handleAddInterviewRound}>
                              <Card className="rounded-md border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors relative z-10 cursor-pointer">
                                <CardContent className="px-2 py-1.5">
                                  <div className="flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                      <PlusCircle className="h-4 w-4" />
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Terminal actions */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
                onClick={handleCompleteAll}
              >
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleWithdraw}
              >
                Withdraw
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={handleReject}
              >
                Reject
              </Button>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}