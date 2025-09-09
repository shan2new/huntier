import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

const selectEditor = (s: RootState) => s.resume

export const selectExperienceItems = createSelector(
  (s: RootState) => selectEditor(s).experienceOrder,
  (s: RootState) => selectEditor(s).experience.entities,
  (order, entities) => order.map((id) => entities[id]).filter(Boolean)
)

export const selectEducationItems = createSelector(
  (s: RootState) => selectEditor(s).educationOrder,
  (s: RootState) => selectEditor(s).education.entities,
  (order, entities) => order.map((id) => entities[id]).filter(Boolean)
)

export const selectAchievementItems = createSelector(
  (s: RootState) => selectEditor(s).achievementsOrder,
  (s: RootState) => selectEditor(s).achievements.entities,
  (order, entities) => order.map((id) => entities[id]).filter(Boolean)
)

export const selectProjectItems = createSelector(
  (s: RootState) => selectEditor(s).projectsOrder,
  (s: RootState) => selectEditor(s).projects.entities,
  (order, entities) => order.map((id) => entities[id]).filter(Boolean)
)

export const selectCertificationItems = createSelector(
  (s: RootState) => selectEditor(s).certificationsOrder,
  (s: RootState) => selectEditor(s).certifications.entities,
  (order, entities) => order.map((id) => entities[id]).filter(Boolean)
)

export const selectResumeOutline = createSelector(
  (s: RootState) => selectEditor(s).sectionOrder,
  (s: RootState) => selectEditor(s).sections.entities,
  (order, entities) => order.map((id) => {
    const s = entities[id] as any
    return s ? { id: s.id, type: s.type, title: s.title } : null
  }).filter(Boolean)
)

export const selectMeta = (s: RootState) => selectEditor(s).meta
export const selectPersonalInfo = (s: RootState) => selectEditor(s).personalInfo
export const selectSummary = (s: RootState) => selectEditor(s).summary
export const selectSkills = (s: RootState) => selectEditor(s).skills

export const selectDenormalizedSections = createSelector(
  [
    (s: RootState) => selectEditor(s).sectionOrder,
    (s: RootState) => selectEditor(s).sections.entities,
    selectExperienceItems,
    selectEducationItems,
    selectAchievementItems,
    selectProjectItems,
    selectCertificationItems,
    selectSummary,
    selectSkills,
  ],
  (order, entities, exp, edu, ach, proj, cert, summary, skills) => {
    const items = order.map((id) => entities[id]).filter(Boolean) as any[]
    return items.map((section: any, index: number) => {
      let content: any = []
      switch (section.type) {
        case 'summary':
          content = { text: summary || '' }
          break
        case 'experience':
          content = exp.map(({ id: _id, ...rest }: any) => rest)
          break
        case 'education':
          content = edu.map(({ id: _id, ...rest }: any) => rest)
          break
        case 'achievements':
          content = ach.map(({ id: _id, ...rest }: any) => rest)
          break
        case 'projects':
          content = proj.map(({ id: _id, ...rest }: any) => rest)
          break
        case 'certifications':
          content = cert.map(({ id: _id, ...rest }: any) => rest)
          break
        case 'skills':
          content = { groups: [{ name: '', skills }] }
          break
        default:
          content = []
      }
      return { id: section.id, type: section.type, title: section.title, order: index, content }
    })
  }
)


