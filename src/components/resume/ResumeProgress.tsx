import { useEffect, useState } from 'react'
import { ResumeCompletionCard } from '@/components/resume/ResumeCompletionCard'

type ResumeProgressProps = {
  personalInfo: any
  summary: string
  experience: Array<any>
  skills: Array<string>
}

export function ResumeProgress({ personalInfo, summary, experience, skills }: ResumeProgressProps) {
  const [progress, setProgress] = useState(0)
  const [missingItems, setMissingItems] = useState<string[]>([])

  useEffect(() => {
    const items = []
    let completed = 0
    const total = 7 // Total items to check

    // Check personal info
    if (personalInfo?.fullName) {
      completed++
    } else {
      items.push('Add your name')
    }

    if (personalInfo?.email) {
      completed++
    } else {
      items.push('Add your email')
    }

    if (personalInfo?.phone) {
      completed++
    } else {
      items.push('Add your phone number')
    }

    // Check summary
    if (summary && summary.length > 50) {
      completed++
    } else {
      items.push('Write a professional summary')
    }

    // Check experience
    if (experience && experience.length > 0) {
      completed++
      // Check if experience has bullets
      const hasBullets = experience.some(exp => exp.bullets && exp.bullets.length > 0 && exp.bullets.some((b: string) => b.trim()))
      if (hasBullets) {
        completed++
      } else {
        items.push('Add bullet points to your experience')
      }
    } else {
      items.push('Add work experience')
    }

    // Check skills
    if (skills && skills.length >= 3) {
      completed++
    } else {
      items.push('Add at least 3 skills')
    }

    setProgress(Math.round((completed / total) * 100))
    setMissingItems(items.slice(0, 3)) // Show max 3 items
  }, [personalInfo, summary, experience, skills])

  if (progress === 100) return null

  return (
    <ResumeCompletionCard progress={progress} missingItems={missingItems} />
  )
}

export default ResumeProgress
