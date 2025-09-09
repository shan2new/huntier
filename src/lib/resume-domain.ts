// Domain helpers for resume data transformations. Pure, UI-agnostic.
// Keep this file free of React or browser-only APIs.

import type { ResumeSectionType } from '@/types/resume'

export type ResumeSection = {
  id: string
  type: ResumeSectionType | string
  title: string
  order: number
  content: any
}

export type ResumeSnapshot = {
  id?: string
  name?: string
  personal_info?: Record<string, any>
  summary?: string
  experience?: Array<any>
  achievements?: Array<any>
  leadership?: Array<any>
  education?: Array<any>
  technologies?: Array<any>
  certifications?: Array<any>
  additional_section?: Array<any>
  sections: Array<ResumeSection>
  template_id?: string | null
  theme?: any
}

export const EMPTY_RESUME: ResumeSnapshot = {
  id: undefined,
  name: 'Untitled Resume',
  personal_info: { fullName: '', email: '', phone: '', location: '', photoUrl: '' },
  summary: '',
  experience: [],
  achievements: [],
  leadership: [],
  education: [],
  technologies: [],
  certifications: [],
  additional_section: [],
  sections: [],
  template_id: null,
  theme: { font: 'Inter', size: 'md', accent: 'zinc', id: 'minimal' },
}

export function deriveSkillsTags(snapshot: Pick<ResumeSnapshot, 'sections' | 'technologies'>): string[] {
  const skillsFromSkillsSection: string[] = (() => {
    const groups = (snapshot.sections?.find((s) => s.type === 'skills')?.content?.groups || []) as Array<any>
    if (!Array.isArray(groups) || groups.length === 0) return []
    const all = groups.flatMap((g) => (Array.isArray(g.skills) ? g.skills : []))
    return all
  })()

  const skillsFromTech: string[] = (() => {
    const tech = Array.isArray(snapshot.technologies) ? snapshot.technologies : []
    const all = tech.flatMap((g: any) => (Array.isArray(g?.skills) ? g.skills : []))
    return all
  })()

  const unique = Array.from(
    new Set(
      [...skillsFromSkillsSection, ...skillsFromTech]
        .map((s) => String(s).trim())
        .filter(Boolean)
    )
  )
  return unique
}

export function buildSectionsFromData(src: Partial<ResumeSnapshot>): ResumeSection[] {
  const sections: Array<ResumeSection> = []
  let order = 0
  // Always include summary
  sections.push({ id: 'summary', type: 'summary', title: 'Summary', order: order++, content: { text: src.summary || '' } })
  if (Array.isArray(src.experience) && src.experience.length > 0) {
    sections.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: src.experience })
  }
  if (Array.isArray(src.education) && src.education.length > 0) {
    sections.push({ id: 'education', type: 'education', title: 'Education', order: order++, content: src.education })
  }
  if (Array.isArray(src.technologies) && src.technologies.length > 0) {
    sections.push({ id: 'skills', type: 'skills', title: 'Skills', order: order++, content: { groups: src.technologies } })
  }
  if (Array.isArray(src.achievements) && src.achievements.length > 0) {
    sections.push({ id: 'achievements', type: 'achievements', title: 'Achievements', order: order++, content: src.achievements })
  }
  if (Array.isArray(src.certifications) && src.certifications.length > 0) {
    sections.push({ id: 'certifications', type: 'certifications', title: 'Certifications', order: order++, content: src.certifications })
  }
  if (sections.length === 1) {
    sections.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: [] })
  }
  return sections
}

export function ensureSectionsWithSummary(sections: Array<ResumeSection>, summaryText: string): Array<ResumeSection> {
  const withoutSummary = (Array.isArray(sections) ? sections : []).filter((s) => s.type !== 'summary')
  const ordered = withoutSummary.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const final = [
    { id: 'summary', type: 'summary', title: 'Summary', order: 0, content: { text: summaryText || '' } },
    ...ordered.map((s, idx) => ({ ...s, order: idx + 1 })),
  ]
  return final
}

export function setSkillsFromTags(prev: ResumeSnapshot, tags: Array<string>): ResumeSnapshot {
  const unique = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
  const nextSections = (prev.sections || []).some((s: any) => s.type === 'skills')
    ? (prev.sections || []).map((s: any) => (s.type === 'skills' ? { ...s, content: { groups: [{ name: '', skills: unique }] } } : s))
    : [...(prev.sections || []), { id: 'skills', type: 'skills', title: 'Skills', order: (prev.sections || []).length, content: { groups: [{ name: '', skills: unique }] } }]
  return {
    ...prev,
    technologies: [{ name: '', skills: unique }],
    sections: nextSections,
  }
}

export function reindexSections(sections: Array<ResumeSection>): Array<ResumeSection> {
  return sections
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s, i) => ({ ...s, order: i }))
}


