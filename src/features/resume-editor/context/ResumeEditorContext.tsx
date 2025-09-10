import { createContext, useContext, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { resumeEditorActions } from '../state/resumeEditorSlice'
import type { RootState } from '@/store'

type ResumeEditorContextValue = {
  resumeId: string
  resumeData: any
  saving: boolean
  hasUnsavedChanges: boolean
  exporting: boolean
  importing: boolean
  loading: boolean
  skillsTags: string[]
  availableSections: Array<{ type: string; title: string }>
  removeSection: (type: string) => void
  reorderSections: (fromIndex: number, toIndex: number) => void
  // topbar
  setName: (v: string) => void
  setTemplateId: (v: string | null) => void
  setFontId: (v: string) => void
  setThemeId: (v: any) => void
  // save
  handleSave: (_show?: boolean) => void
  // export/import
  exportPdf: () => void
  exportDocx: () => void
  importPdf: (file: File) => void
  // editor
  updatePersonalInfo: (field: string, value: string) => void
  setSkillsFromTags: (tags: string[]) => void
  setSummaryText: (t: string) => void
  addSection: (type: string, title: string) => void
  // experience
  addExperienceItem: () => void
  removeExperienceItem: (index: number) => void
  setExperienceField: (index: number, field: any, value: string) => void
  addExperienceBullet: (index: number) => void
  removeExperienceBullet: (index: number, bulletIndex: number) => void
  setExperienceBullet: (index: number, bulletIndex: number, text: string) => void
  replaceExperienceBullets: (index: number, bullets: string[]) => void
  // education
  addEducationItem: () => void
  removeEducationItem: (index: number) => void
  setEducationField: (index: number, field: string, value: string) => void
  // achievements
  addAchievementItem: () => void
  removeAchievementItem: (index: number) => void
  setAchievementField: (index: number, field: string, value: string) => void
  // projects
  addProjectItem: () => void
  removeProjectItem: (index: number) => void
  setProjectField: (index: number, field: string, value: string) => void
  addProjectHighlight: (index: number) => void
  removeProjectHighlight: (index: number, highlightIndex: number) => void
  setProjectHighlight: (index: number, highlightIndex: number, text: string) => void
  // certifications
  addCertificationItem: () => void
  removeCertificationItem: (index: number) => void
  setCertificationField: (index: number, field: string, value: string) => void
  // ai helpers
  enhanceSummary: (current: string) => Promise<string>
  enhanceExperienceBullet: (_index: number, _bulletIndex: number, current: string) => Promise<string>
  suggestBullets: (index: number) => void
  ensureSeed?: () => void
}

const ResumeEditorContext = createContext<ResumeEditorContextValue | undefined>(undefined)

type ProviderProps = { resumeId: string; children: React.ReactNode }

export function ResumeEditorProvider({ resumeId, children }: ProviderProps) {
  const dispatch = useDispatch()
  const resume = useSelector((s: RootState) => s.resume)
  useEffect(() => {
    if (resumeId === 'new') {
      dispatch(resumeEditorActions.resetAll())
      dispatch(resumeEditorActions.ensureSeeded())
    } else {
      dispatch({ type: 'resume/LOAD_REQUEST', payload: resumeId })
    }
  }, [resumeId])

  const value = useMemo<ResumeEditorContextValue>(() => ({
    resumeId,
    resumeData: {
      id: resume.meta.id,
      name: resume.meta.name,
      template_id: resume.meta.templateId,
      theme: { id: resume.meta.themeId, font: resume.meta.fontId },
      personal_info: resume.personalInfo,
      summary: resume.summary,
      sections: [],
    },
    saving: resume.flags.saving,
    hasUnsavedChanges: resume.flags.hasUnsavedChanges,
    exporting: resume.flags.exporting,
    importing: resume.flags.importing,
    loading: (resume as any).flags.loading,
    skillsTags: Array.isArray(resume.skills) ? resume.skills : [],
    availableSections: [
      { type: 'education', title: 'Education' },
      { type: 'projects', title: 'Projects' },
      { type: 'achievements', title: 'Achievements' },
      { type: 'skills', title: 'Skills' },
      { type: 'leadership', title: 'Leadership' },
      { type: 'certifications', title: 'Certifications' },
    ],
    removeSection: (type: string) => {
      // Remove first matching section of this type
      const order: string[] = (resume as any).sectionOrder || []
      const entities: Record<string, any> = (resume as any).sections?.entities || {}
      const match = order
        .map((id: string) => entities[id])
        .find((s: any) => s && s.type === type)
      if (match?.id) dispatch(resumeEditorActions.removeSection({ id: match.id }))
    },
    reorderSections: (fromIndex: number, toIndex: number) => {
      const current: string[] = (resume as any).sectionOrder || []
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return
      const next = current.slice()
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      dispatch(resumeEditorActions.reorderSections({ order: next }))
    },
    // topbar
    setName: (v: string) => dispatch(resumeEditorActions.setMeta({ name: v })),
    setTemplateId: (v: string | null) => dispatch(resumeEditorActions.setMeta({ templateId: v as any })),
    setFontId: (v: string) => dispatch(resumeEditorActions.setMeta({ fontId: v as any })),
    setThemeId: (v: any) => dispatch(resumeEditorActions.setMeta({ themeId: v as any })),
    handleSave: (_show?: boolean) => dispatch({ type: 'resume/SAVE_REQUEST' }),
    exportPdf: () => dispatch({ type: 'resume/EXPORT_REQUEST', payload: { format: 'pdf' } }),
    exportDocx: () => dispatch({ type: 'resume/EXPORT_REQUEST', payload: { format: 'docx' } }),
    importPdf: (file: File) => dispatch({ type: 'resume/IMPORT_PDF_REQUEST', payload: file }),
    // editor
    updatePersonalInfo: (field: string, value: string) => dispatch(resumeEditorActions.setPersonalInfoField({ field, value })),
    setSkillsFromTags: (tags: string[]) => dispatch(resumeEditorActions.setSkills(tags)),
    setSummaryText: (t: string) => dispatch(resumeEditorActions.setSummary(t)),
    addSection: (type: string, title: string) => dispatch(resumeEditorActions.addSection({ type, title })),
    // exp
    addExperienceItem: () => dispatch(resumeEditorActions.addExperienceItem()),
    removeExperienceItem: (index: number) => dispatch(resumeEditorActions.removeExperienceItem({ index })),
    setExperienceField: (index: number, field: any, value: string) => dispatch(resumeEditorActions.setExperienceField({ index, field, value } as any)),
    addExperienceBullet: (index: number) => dispatch(resumeEditorActions.addExperienceBullet({ index })),
    removeExperienceBullet: (index: number, bulletIndex: number) => dispatch(resumeEditorActions.removeExperienceBullet({ index, bulletIndex })),
    setExperienceBullet: (index: number, bulletIndex: number, text: string) => dispatch(resumeEditorActions.setExperienceBullet({ index, bulletIndex, text })),
    replaceExperienceBullets: (index: number, bullets: string[]) => dispatch(resumeEditorActions.replaceExperienceBullets({ index, bullets })),
    // edu
    addEducationItem: () => dispatch(resumeEditorActions.addEducationItem()),
    removeEducationItem: (index: number) => dispatch(resumeEditorActions.removeEducationItem({ index })),
    setEducationField: (index: number, field: string, value: string) => dispatch(resumeEditorActions.setEducationField({ index, field: field as any, value })),
    // ach
    addAchievementItem: () => dispatch(resumeEditorActions.addAchievementItem()),
    removeAchievementItem: (index: number) => dispatch(resumeEditorActions.removeAchievementItem({ index })),
    setAchievementField: (index: number, field: string, value: string) => dispatch(resumeEditorActions.setAchievementField({ index, field: field as any, value })),
    // proj
    addProjectItem: () => dispatch(resumeEditorActions.addProjectItem()),
    removeProjectItem: (index: number) => dispatch(resumeEditorActions.removeProjectItem({ index })),
    setProjectField: (index: number, field: string, value: string) => dispatch(resumeEditorActions.setProjectField({ index, field: field as any, value })),
    addProjectHighlight: (index: number) => dispatch(resumeEditorActions.addProjectHighlight({ index })),
    removeProjectHighlight: (index: number, highlightIndex: number) => dispatch(resumeEditorActions.removeProjectHighlight({ index, highlightIndex })),
    setProjectHighlight: (index: number, highlightIndex: number, text: string) => dispatch(resumeEditorActions.setProjectHighlight({ index, highlightIndex, text })),
    // cert
    addCertificationItem: () => dispatch(resumeEditorActions.addCertificationItem()),
    removeCertificationItem: (index: number) => dispatch(resumeEditorActions.removeCertificationItem({ index })),
    setCertificationField: (index: number, field: string, value: string) => dispatch(resumeEditorActions.setCertificationField({ index, field: field as any, value })),
    // ai helpers
    enhanceSummary: async (current: string) => await new Promise<string>((resolve) => dispatch({ type: 'resume/ENHANCE_SUMMARY_REQUEST', payload: { text: current, resolve } })),
    enhanceExperienceBullet: async (_index: number, _bulletIndex: number, current: string) => await new Promise<string>((resolve) => dispatch({ type: 'resume/ENHANCE_BULLET_REQUEST', payload: { text: current, resolve } })),
    suggestBullets: (index: number) => dispatch({ type: 'resume/SUGGEST_BULLETS_REQUEST', payload: index }),
    ensureSeed: () => dispatch(resumeEditorActions.ensureSeeded()),
  }), [resumeId, resume, dispatch])

  return (
    <ResumeEditorContext.Provider value={value}>
      {children}
    </ResumeEditorContext.Provider>
  )
}

export function useResumeEditor() {
  const ctx = useContext(ResumeEditorContext)
  if (ctx) return ctx
  return {
    resumeId: '',
    resumeData: { id: null, name: '', template_id: null, theme: { id: 'minimal', font: 'inter' }, personal_info: {}, summary: '', sections: [] },
    saving: false,
    hasUnsavedChanges: false,
    exporting: false,
    importing: false,
    skillsTags: [],
    availableSections: [],
    setName: () => {},
    setTemplateId: () => {},
    setFontId: () => {},
    setThemeId: () => {},
    handleSave: () => {},
    updatePersonalInfo: () => {},
    setSkillsFromTags: () => {},
    setSummaryText: () => {},
    addSection: () => {},
    addExperienceItem: () => {},
    removeExperienceItem: () => {},
    setExperienceField: () => {},
    addExperienceBullet: () => {},
    removeExperienceBullet: () => {},
    setExperienceBullet: () => {},
    replaceExperienceBullets: () => {},
    addEducationItem: () => {},
    removeEducationItem: () => {},
    setEducationField: () => {},
    addAchievementItem: () => {},
    removeAchievementItem: () => {},
    setAchievementField: () => {},
    addProjectItem: () => {},
    removeProjectItem: () => {},
    setProjectField: () => {},
    addProjectHighlight: () => {},
    removeProjectHighlight: () => {},
    setProjectHighlight: () => {},
    addCertificationItem: () => {},
    removeCertificationItem: () => {},
    setCertificationField: () => {},
    enhanceSummary: async (s: string) => s,
    enhanceExperienceBullet: async (_i: number, _bi: number, s: string) => s,
    suggestBullets: () => {},
  } as any
}


