import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { 
  deleteInterviewWithRefresh,
  listInterviewsWithRefresh, 
  rescheduleInterviewWithRefresh, 
  scheduleInterviewWithRefresh, 
  updateInterviewNameWithRefresh,
  updateInterviewTypeWithRefresh 
} from '@/lib/api'

export interface InterviewData {
  id: string
  type: InterviewType
  custom_name?: string
  status: 'unscheduled' | 'scheduled' | 'rescheduled' | 'completed' | 'rejected' | 'withdrawn'
  scheduled_at?: string
  completed_at?: string
  result?: string
  rejection_reason?: string
}

const INTERVIEW_TYPES = ['screen', 'dsa', 'system_design', 'coding', 'hm', 'bar_raiser', 'other'] as const
export type InterviewType = typeof INTERVIEW_TYPES[number]

export const interviewTypeLabels: Record<InterviewType, string> = {
  screen: 'Screen',
  dsa: 'DSA',
  system_design: 'System Design',
  coding: 'Coding',
  hm: 'Hiring Manager',
  bar_raiser: 'Bar Raiser',
  other: 'Other',
}

export const isInterviewType = (v: string): v is InterviewType => 
  (INTERVIEW_TYPES as ReadonlyArray<string>).includes(v)

export function useInterviewData(applicationId?: string) {
  const [interviewData, setInterviewData] = useState<Record<string, InterviewData>>({})
  const [interviewRounds, setInterviewRounds] = useState<Array<string>>([])
  const [isLoading, setIsLoading] = useState(false)

  const { getToken } = useAuth()
  
  // Helper function to map interviews to stage IDs and update state
  const mapInterviewsToStages = useCallback((interviews: Array<InterviewData>) => {
    const interviewMap: Record<string, InterviewData> = {}
    const rounds: Array<string> = []
    
    if (interviews.length > 0) {
      interviews.forEach((interviewItem, index) => {
        const roundStageId = `interview_round_${index + 1}`
        interviewMap[roundStageId] = interviewItem
        rounds.push(roundStageId)
      })
    }
    
    return { interviewMap, rounds }
  }, [])


  const scheduleInterview = useCallback(async (stageId: string, dateTime: Date, type: InterviewType): Promise<InterviewData | undefined> => {
    if (!applicationId) return undefined

    try {
      const tokenFn = async () => (await getToken()) || ''
      const newInterview = await scheduleInterviewWithRefresh<InterviewData>(tokenFn, applicationId, {
        type,
        scheduled_at: dateTime.toISOString(),
      })

      // Add the interview to our local state
      setInterviewData(prev => ({
        ...prev,
        [stageId]: newInterview
      }))

      // Add to interview rounds if not already present
      setInterviewRounds(prev => {
        if (!prev.includes(stageId)) {
          return [...prev, stageId]
        }
        return prev
      })
      
      return newInterview
    } catch (error) {
      console.error('Failed to schedule interview:', error)
      throw error
    }
  }, [applicationId])

  const rescheduleInterview = useCallback(async (stageId: string, dateTime: Date): Promise<InterviewData | undefined> => {
    if (!applicationId) return undefined

    const interview = interviewData[stageId]
    if (!interview?.id) return undefined

    try {
      const tokenFn = async () => (await getToken()) || ''
      const updatedInterview = await rescheduleInterviewWithRefresh<InterviewData>(tokenFn, applicationId, interview.id, {
        scheduled_at: dateTime.toISOString(),
      })

      setInterviewData(prev => ({
        ...prev,
        [stageId]: updatedInterview
      }))
      
      return updatedInterview
    } catch (error) {
      console.error('Failed to reschedule interview:', error)
      throw error
    }
  }, [applicationId, interviewData])

  const updateInterviewType = useCallback(async (stageId: string, type: InterviewType): Promise<InterviewData | undefined> => {
    if (!applicationId) return undefined

    const currentData = interviewData[stageId]
    if (!currentData?.id) return undefined

    try {
      const tokenFn = async () => (await getToken()) || ''
      const updatedInterview = await updateInterviewTypeWithRefresh<InterviewData>(tokenFn, applicationId, currentData.id, {
        type
      })

      setInterviewData(prev => ({
        ...prev,
        [stageId]: updatedInterview
      }))
      return updatedInterview
    } catch (error) {
      console.error('Failed to update interview type:', error)
      throw error
    }
  }, [applicationId, interviewData])

  const updateInterviewName = useCallback(async (stageId: string, name: string): Promise<InterviewData | undefined> => {
    if (!applicationId) return undefined

    const currentData = interviewData[stageId]
    if (!currentData?.id) return undefined

    try {
      const tokenFn = async () => (await getToken()) || ''
      const updatedInterview = await updateInterviewNameWithRefresh<InterviewData>(tokenFn, applicationId, currentData.id, {
        custom_name: name.trim()
      })

      setInterviewData(prev => ({
        ...prev,
        [stageId]: updatedInterview
      }))
      
      return updatedInterview
    } catch (error) {
      console.error('Failed to update interview name:', error)
      throw error
    }
  }, [applicationId, interviewData])

  const addInterviewRound = useCallback(async () => {
    if (!applicationId) return

    try {
      const tokenFn = async () => (await getToken()) || ''
      // Create new unscheduled interview round via API (default DSA type)
      await scheduleInterviewWithRefresh<InterviewData>(tokenFn, applicationId, {
        type: 'dsa',
        // Don't set scheduled_at to keep it unscheduled
      })

      // Manually refresh interview data to avoid circular dependency
      const interviews = await listInterviewsWithRefresh<Array<InterviewData>>(tokenFn, applicationId)
      
      // Use the helper to map interviews to stages
      const { interviewMap, rounds } = mapInterviewsToStages(interviews)

      setInterviewData(interviewMap)
      setInterviewRounds(rounds)
    } catch (error) {
      console.error('Failed to add interview round:', error)
      throw error
    }
  }, [applicationId, mapInterviewsToStages])

  useEffect(() => {
    if (!applicationId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const tokenFn = async () => (await getToken()) || ''
        const interviews = await listInterviewsWithRefresh<Array<InterviewData>>(tokenFn, applicationId)
        
        // Map interviews to stage names
        const { interviewMap, rounds } = mapInterviewsToStages(interviews)

        setInterviewData(interviewMap)
        setInterviewRounds(rounds)
      } catch (error) {
        console.error('Failed to fetch interview data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [applicationId, mapInterviewsToStages]) // Only depend on applicationId - create tokenFn inline to avoid dependency

  const deleteInterviewRound = useCallback(async (roundStageId: string): Promise<boolean> => {
    if (!applicationId) return false

    const interviewToDelete = interviewData[roundStageId]
    if (!interviewToDelete || !interviewToDelete.id) return false

    try {
      const tokenFn = async () => (await getToken()) || ''
      await deleteInterviewWithRefresh(tokenFn, applicationId, interviewToDelete.id)

      // After deleting, refetch all interviews to ensure proper indexing
      const interviews = await listInterviewsWithRefresh<Array<InterviewData>>(tokenFn, applicationId)
      
      // Use the helper function to map interviews to stages
      const { interviewMap, rounds } = mapInterviewsToStages(interviews)

      setInterviewData(interviewMap)
      setInterviewRounds(rounds)
      
      return true
    } catch (error) {
      console.error('Failed to delete interview:', error)
      return false
    }
  }, [applicationId, interviewData])

  return {
    interviewData,
    interviewRounds,
    isLoading,
    scheduleInterview,
    rescheduleInterview,
    updateInterviewName,
    updateInterviewType,
    addInterviewRound,
    deleteInterviewRound,
    INTERVIEW_TYPES,
    interviewTypeLabels,
    isInterviewType
  }
}
