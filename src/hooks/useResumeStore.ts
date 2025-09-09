import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useAuthToken } from '@/lib/auth'
import {
  setName,
  setTemplateId,
  setFontId,
  setThemeId,
  setExporting,
  setImporting,
  ensureSeeded,
  updatePersonalInfo,
  setSummaryText,
  setSkills,
  addSection,
  applyOp,
} from '@/store/slices/resumeSlice'
import { deriveSkillsTags } from '@/lib/resume-domain'
import { aiEnhanceTextWithRefresh, aiSuggestBulletsWithRefresh } from '@/lib/api'

export function useResumeStore(_resumeId: string) {
  const dispatch = useDispatch()
  const state = useSelector((s: RootState) => s.resume)
  const { getToken } = useAuthToken()

  // mimic previous API
  const setNameCb = (v: string) => dispatch(setName(v))
  const setTemplateIdCb = (v: string | null) => dispatch(setTemplateId(v))
  const setFontIdCb = (v: string) => dispatch(setFontId(v))
  const setThemeIdCb = (v: any) => dispatch(setThemeId(v))
  const setExportingCb = (v: boolean) => dispatch(setExporting(v))
  const setImportingCb = (v: boolean) => dispatch(setImporting(v))
  const updatePersonalInfoCb = (field: string, value: string) => dispatch(updatePersonalInfo({ field, value }))
  const setSkillsFromTags = (tags: string[]) => dispatch(setSkills(tags))
  const setSummaryTextCb = (t: string) => dispatch(setSummaryText(t))
  const addSectionCb = (type: string, title: string) => dispatch(addSection({ type, title }))

  // operations
  const addExperienceItem = () => dispatch(applyOp({ op: 'experience/addItem' }))
  const removeExperienceItem = (index: number) => dispatch(applyOp({ op: 'experience/removeItem', payload: { index } }))
  const setExperienceField = (index: number, field: any, value: string) => dispatch(applyOp({ op: 'experience/setField', payload: { index, field, value } }))
  const addExperienceBullet = (index: number) => dispatch(applyOp({ op: 'experience/addBullet', payload: { index } }))
  const removeExperienceBullet = (index: number, bulletIndex: number) => dispatch(applyOp({ op: 'experience/removeBullet', payload: { index, bulletIndex } }))
  const setExperienceBullet = (index: number, bulletIndex: number, text: string) => dispatch(applyOp({ op: 'experience/setBullet', payload: { index, bulletIndex, text } }))
  const replaceExperienceBullets = (index: number, bullets: string[]) => dispatch(applyOp({ op: 'experience/replaceBullets', payload: { index, bullets } }))

  const addEducationItem = () => dispatch(applyOp({ op: 'education/addItem' }))
  const removeEducationItem = (index: number) => dispatch(applyOp({ op: 'education/removeItem', payload: { index } }))
  const setEducationField = (index: number, field: string, value: string) => dispatch(applyOp({ op: 'education/setField', payload: { index, field, value } }))

  const addAchievementItem = () => dispatch(applyOp({ op: 'achievements/addItem' }))
  const removeAchievementItem = (index: number) => dispatch(applyOp({ op: 'achievements/removeItem', payload: { index } }))
  const setAchievementField = (index: number, field: string, value: string) => dispatch(applyOp({ op: 'achievements/setField', payload: { index, field, value } }))

  const addProjectItem = () => dispatch(applyOp({ op: 'projects/addItem' }))
  const removeProjectItem = (index: number) => dispatch(applyOp({ op: 'projects/removeItem', payload: { index } }))
  const setProjectField = (index: number, field: string, value: string) => dispatch(applyOp({ op: 'projects/setField', payload: { index, field, value } }))
  const addProjectHighlight = (index: number) => dispatch(applyOp({ op: 'projects/addHighlight', payload: { index } }))
  const removeProjectHighlight = (index: number, highlightIndex: number) => dispatch(applyOp({ op: 'projects/removeHighlight', payload: { index, highlightIndex } }))
  const setProjectHighlight = (index: number, highlightIndex: number, text: string) => dispatch(applyOp({ op: 'projects/setHighlight', payload: { index, highlightIndex, text } }))

  const addCertificationItem = () => dispatch(applyOp({ op: 'certifications/addItem' }))
  const removeCertificationItem = (index: number) => dispatch(applyOp({ op: 'certifications/removeItem', payload: { index } }))
  const setCertificationField = (index: number, field: string, value: string) => dispatch(applyOp({ op: 'certifications/setField', payload: { index, field, value } }))

  // Seed once in components
  const ensureSeed = () => dispatch(ensureSeeded())

  const handleSave = (_showNotification?: boolean) => dispatch({ type: 'resume/SAVE_REQUEST' })

  // AI helpers
  const enhanceSummary = async (current: string): Promise<string> => {
    try {
      const id = state.data?.id
      if (!id) return current
      const next: any = await aiEnhanceTextWithRefresh(id, getToken, {
        text: current,
        mode: 'rewrite',
        contentType: 'summary',
        tone: 'professional',
      })
      return typeof next?.text === 'string' ? next.text : current
    } catch {
      return current
    }
  }

  const enhanceExperienceBullet = async (_index: number, _bulletIndex: number, current: string): Promise<string> => {
    try {
      const id = state.data?.id
      if (!id) return current
      const next: any = await aiEnhanceTextWithRefresh(id, getToken, {
        text: current,
        mode: 'rewrite',
        contentType: 'bullet',
        tone: 'professional',
      })
      return typeof next?.text === 'string' ? next.text : current
    } catch {
      return current
    }
  }

  const suggestBullets = async (index: number) => {
    try {
      const id = state.data?.id
      if (!id) return
      const sections = Array.isArray(state.data?.sections) ? state.data.sections : []
      const expSection = sections.find((s: any) => s.type === 'experience') || { content: state.data?.experience || [] }
      const exp = (expSection.content || [])[index]
      const res: any = await aiSuggestBulletsWithRefresh(id, getToken, { role: exp?.role || '' })
      const bullets: string[] = Array.isArray(res?.bullets)
        ? res.bullets
        : (typeof res?.text === 'string' ? res.text.split('\n').map((s: string) => s.replace(/^[-•\s]+/, '')).filter(Boolean) : [])
      if (!bullets.length) return
      dispatch(applyOp({ op: 'experience/replaceBullets', payload: { index, bullets } }))
    } catch {
      // no-op
    }
  }

  return {
    resumeData: state.data,
    saving: state.saving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    exporting: state.exporting,
    setExporting: setExportingCb,
    importing: state.importing,
    setImporting: setImportingCb,
    skillsTags: deriveSkillsTags({ sections: state.data.sections, technologies: state.data.technologies }),
    availableSections: [
      { type: 'education', title: 'Education' },
      { type: 'projects', title: 'Projects' },
      { type: 'achievements', title: 'Achievements' },
      { type: 'skills', title: 'Skills' },
      { type: 'leadership', title: 'Leadership' },
      { type: 'certifications', title: 'Certifications' },
    ],
    jdHints: [],
    // topbar
    setName: setNameCb,
    setTemplateId: setTemplateIdCb,
    setFontId: setFontIdCb,
    setThemeId: setThemeIdCb,
    // save
    handleSave,
    // editor
    updatePersonalInfo: updatePersonalInfoCb,
    setSkillsFromTags,
    setSummaryText: setSummaryTextCb,
    enhanceSummary,
    addProjectItem,
    removeProjectItem,
    setProjectField,
    addProjectHighlight,
    removeProjectHighlight,
    setProjectHighlight,
    enhanceExperienceBullet,
    suggestBullets,
    addSection: addSectionCb,
    addExperienceItem,
    removeExperienceItem,
    setExperienceField,
    addExperienceBullet,
    removeExperienceBullet,
    setExperienceBullet,
    replaceExperienceBullets,
    addEducationItem,
    removeEducationItem,
    setEducationField,
    addAchievementItem,
    removeAchievementItem,
    setAchievementField,
    addCertificationItem,
    removeCertificationItem,
    setCertificationField,
    ensureSeed,
  }
}

export default useResumeStore


