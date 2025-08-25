import { useMemo, useState } from 'react'
import { AddInterviewButton } from './AddInterviewButton'
import { FireworksBackground } from './animate-ui/backgrounds/fireworks'
import { InterviewCard } from './InterviewCard'
import { StageActions } from './StageActions'
import { StageCard } from './StageCard'
import type { StageObject } from '@/types/application'
import { cn } from '@/lib/utils'
import { useInterviewData } from '@/hooks/useInterviewData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'


interface StageVisualizationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStage?: StageObject
  currentMilestone?: string
  onStageChange?: (stageId: string, reason?: string) => void
  editMode?: boolean
  applicationId?: string
}


type Step = { id: string; label: string; editable?: boolean }

// No mapping needed - frontend uses exact same stage names as backend

export function StageVisualization({
  open,
  onOpenChange,
  currentStage = { id: 'wishlist', name: 'Wishlist', type: 'standard' },
  onStageChange,
  editMode = false,
  applicationId,
}: StageVisualizationProps) {
  const [customStageNames, setCustomStageNames] = useState<Record<string, string>>({})

  const {
    interviewData,
    interviewRounds,
    scheduleInterview,
    rescheduleInterview,
    updateInterviewName,
    updateInterviewType,
    addInterviewRound,
    deleteInterviewRound
  } = useInterviewData(open && applicationId ? applicationId : undefined)



  // Generate dynamic steps based on new stage structure
  const steps = useMemo(() => {
    const baseSteps: Array<Step> = [
      { id: 'wishlist', label: customStageNames['wishlist'] || 'Wishlist', editable: true },
      { id: 'recruiter_reachout', label: customStageNames['recruiter_reachout'] || 'Recruiter Reachout', editable: true },
      { id: 'self_review', label: customStageNames['self_review'] || 'Self Review', editable: true },
      { id: 'hr_shortlist', label: customStageNames['hr_shortlist'] || 'HR Shortlist', editable: true },
      { id: 'hm_shortlist', label: customStageNames['hm_shortlist'] || 'Manager Shortlist', editable: true },
    ]
    
    // Add all interview rounds using actual interview round IDs
    interviewRounds.forEach((interviewRoundId, index) => {
      baseSteps.push({
        id: interviewRoundId,
        label: customStageNames[interviewRoundId] || `Round ${index + 1}`,
        editable: true
      })
    })
    
    baseSteps.push({ id: 'offer', label: customStageNames['offer'] || 'Offer' })
    
    return baseSteps
  }, [interviewRounds, customStageNames])

  // Get initial step based on current stage
  const currentStepIndex = useMemo(() => {
    const index = steps.findIndex(s => s.id === currentStage.id)
    return index !== -1 ? index : 0
  }, [currentStage, steps])

  const handleStageClick = (stageId: string) => {
    // Don't allow stage changes when in edit mode
    if (editMode) {
      return
    }
    // Interview rounds are now actual stages, so we transition directly to them
    onStageChange?.(stageId)
  }

  const handleAddInterviewRound = async () => {
    try {
      await addInterviewRound()
      // Transition to the new interview round stage if it's the first one and we're currently at hm_shortlist
      if (interviewRounds.length === 0 && currentStage.id === 'hm_shortlist') {
        onStageChange?.('interview_round_1')
      }
    } catch (error) {
      console.error('Failed to add interview round:', error)
    }
  }

  const handleStageNameChange = (stageId: string, newLabel: string) => {
    setCustomStageNames(prev => ({
      ...prev,
      [stageId]: newLabel
    }))
  }

  const isOfferStage = () => {
    return currentStage.id === 'offer'
  }

  const handleComplete = () => onStageChange?.('offer')
  const handleReject = () => onStageChange?.('rejected')
  const handleWithdraw = (reason: string) => onStageChange?.('withdrawn', reason)
  

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
        
        <ScrollArea className="h-[70vh] w-full pb-6">
          <div className="mx-auto">
            <div className="relative flex flex-col items-center justify-center gap-12 z-0">
              
              {steps.map((step, i) => {
                const isActive = i === currentStepIndex
                const isCompleted = i < currentStepIndex
                const isInterviewRound = interviewRounds.includes(step.id)
                const isLastInterviewRound = isInterviewRound && step.id === interviewRounds[interviewRounds.length - 1]
                const data = interviewData[step.id]
                
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
                      <div className={cn(
                        "flex items-center",
                        editMode ? "cursor-default" : "cursor-pointer"
                      )}>
                        {/* Step content */}
                        <div className="ml-3 flex-1 relative z-10">
                          {isInterviewRound ? (
                            <InterviewCard
                              stepId={step.id}
                              label={step.label}
                              data={data}
                              isCompleted={isCompleted}
                              isActive={isActive}
                              canDelete={interviewRounds.length > 1}
                              onSchedule={scheduleInterview}
                              onReschedule={rescheduleInterview}
                              onUpdateName={updateInterviewName}
                              onUpdateType={updateInterviewType}
                              onDelete={deleteInterviewRound}
                              onClick={() => handleStageClick(step.id)}
                            />
                          ) : (
                            <StageCard
                              stepId={step.id}
                              label={step.label}
                              isCompleted={isCompleted}
                              isActive={isActive}
                              isEditable={step.editable}
                              editMode={editMode}
                              currentStage={currentStage}
                              onLabelChange={handleStageNameChange}
                              onClick={() => handleStageClick(step.id)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Interview button - show after hm_shortlist if no interview rounds, or after last interview round */}
                    {!isOfferStage() && (
                      (step.id === 'hm_shortlist' && interviewRounds.length === 0) ||
                      isLastInterviewRound
                    ) && (
                      <AddInterviewButton onAdd={handleAddInterviewRound} />
                    )}
                  </div>
                )
              })}
            </div>

            <StageActions
              onComplete={handleComplete}
              onWithdraw={handleWithdraw}
              onReject={handleReject}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}