import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { ResumeThemeId } from '@/lib/themes'
import { EMPTY_RESUME, buildSectionsFromData, reindexSections, setSkillsFromTags } from '@/lib/resume-domain'

export type ResumeState = {
  data: any
  saving: boolean
  hasUnsavedChanges: boolean
  exporting: boolean
  importing: boolean
}

const initialState: ResumeState = {
  data: EMPTY_RESUME,
  saving: false,
  hasUnsavedChanges: false,
  exporting: false,
  importing: false,
}

const slice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    // basic fields
    setAll(state, action: PayloadAction<any>) {
      state.data = action.payload
      state.hasUnsavedChanges = false
    },
    setName(state, action: PayloadAction<string>) {
      state.data.name = action.payload
      state.hasUnsavedChanges = true
    },
    setTemplateId(state, action: PayloadAction<string | null>) {
      state.data.template_id = action.payload
      state.hasUnsavedChanges = true
    },
    setFontId(state, action: PayloadAction<string>) {
      state.data.theme = { ...state.data.theme, font: action.payload }
      state.hasUnsavedChanges = true
    },
    setThemeId(state, action: PayloadAction<ResumeThemeId>) {
      state.data.theme = { ...state.data.theme, id: action.payload }
      state.hasUnsavedChanges = true
    },
    setExporting(state, action: PayloadAction<boolean>) { state.exporting = action.payload },
    setImporting(state, action: PayloadAction<boolean>) { state.importing = action.payload },

    // sections bootstrap
    ensureSeeded(state) {
      if ((state.data.sections || []).length === 0) {
        state.data.sections = buildSectionsFromData(state.data)
      }
    },

    // personal info
    updatePersonalInfo(state, action: PayloadAction<{ field: string; value: string }>) {
      const { field, value } = action.payload
      state.data.personal_info = { ...state.data.personal_info, [field]: value }
      state.hasUnsavedChanges = true
    },

    // summary
    setSummaryText(state, action: PayloadAction<string>) {
      const text = action.payload
      state.data.summary = text
      state.data.sections = (state.data.sections).map((s: any) => (s.type === 'summary' ? { ...s, content: { text } } : s))
      state.hasUnsavedChanges = true
    },

    // skills
    setSkills(state, action: PayloadAction<string[]>) {
      state.data = setSkillsFromTags(state.data, action.payload)
      state.hasUnsavedChanges = true
    },

    // sections management (simplified)
    addSection(state, action: PayloadAction<{ type: string; title: string }>) {
      const { type, title } = action.payload
      const newSection = {
        id: type,
        type,
        title,
        order: (state.data.sections || []).length,
        content: type === 'skills' ? { groups: [{ name: '', skills: [] }] } : [],
      }
      state.data.sections = reindexSections([...(state.data.sections || []), newSection])
      state.hasUnsavedChanges = true
    },

    // Save flags
    setSaving(state, action: PayloadAction<boolean>) { state.saving = action.payload },
    setHasUnsaved(state, action: PayloadAction<boolean>) { state.hasUnsavedChanges = action.payload },

    // Load success
    loadSuccess(state, action: PayloadAction<any>) {
      state.data = action.payload
      state.hasUnsavedChanges = false
    },

    // Rich mutations for nested collections used by the editor
    applyOp(state, action: PayloadAction<{ op: string; payload?: any }>) {
      const { op, payload } = action.payload
      const d: any = state.data
      // const findSection = (type: string) => (d.sections || []).find((s: any) => s.type === type)
      const setSection = (type: string, updater: (content: any) => any) => {
        d.sections = (d.sections || []).map((s: any) => (s.type === type ? { ...s, content: updater(s.content) } : s))
      }
      switch (op) {
        // Experience
        case 'experience/addItem': {
          const newExp = { company: '', role: '', startDate: '', endDate: '', bullets: [''] }
          d.experience = Array.isArray(d.experience) ? [...d.experience, newExp] : [newExp]
          setSection('experience', (content: any[]) => Array.isArray(content) ? [...content, newExp] : [newExp])
          break
        }
        case 'experience/removeItem': {
          const index = payload?.index ?? -1
          d.experience = (Array.isArray(d.experience) ? d.experience : []).filter((_: any, i: number) => i !== index)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.filter((_: any, i: number) => i !== index) : []))
          break
        }
        case 'experience/setField': {
          const { index, field, value } = payload
          d.experience = (Array.isArray(d.experience) ? d.experience : []).map((it: any, i: number) => i === index ? { ...it, [field]: value } : it)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) : []))
          break
        }
        case 'experience/addBullet': {
          const { index } = payload
          d.experience = (Array.isArray(d.experience) ? d.experience : []).map((it: any, i: number) => i === index ? { ...it, bullets: [...(it.bullets || []), ''] } : it)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, bullets: [...(it.bullets || []), ''] } : it)) : []))
          break
        }
        case 'experience/removeBullet': {
          const { index, bulletIndex } = payload
          d.experience = (Array.isArray(d.experience) ? d.experience : []).map((it: any, i: number) => i === index ? { ...it, bullets: (it.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : it)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, bullets: (it.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : it)) : []))
          break
        }
        case 'experience/setBullet': {
          const { index, bulletIndex, text } = payload
          d.experience = (Array.isArray(d.experience) ? d.experience : []).map((it: any, i: number) => i === index ? { ...it, bullets: (it.bullets || []).map((b: string, bi: number) => (bi === bulletIndex ? text : b)) } : it)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, bullets: (it.bullets || []).map((b: string, bi: number) => (bi === bulletIndex ? text : b)) } : it)) : []))
          break
        }
        case 'experience/replaceBullets': {
          const { index, bullets } = payload
          d.experience = (Array.isArray(d.experience) ? d.experience : []).map((it: any, i: number) => i === index ? { ...it, bullets } : it)
          setSection('experience', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, bullets } : it)) : []))
          break
        }

        // Education
        case 'education/addItem': {
          const newEdu = { school: '', degree: '', field: '', startDate: '', endDate: '' }
          d.education = Array.isArray(d.education) ? [...d.education, newEdu] : [newEdu]
          setSection('education', (content: any[]) => Array.isArray(content) ? [...content, newEdu] : [newEdu])
          break
        }
        case 'education/removeItem': {
          const { index } = payload
          d.education = (Array.isArray(d.education) ? d.education : []).filter((_: any, i: number) => i !== index)
          setSection('education', (content: any[]) => (Array.isArray(content) ? content.filter((_: any, i: number) => i !== index) : []))
          break
        }
        case 'education/setField': {
          const { index, field, value } = payload
          d.education = (Array.isArray(d.education) ? d.education : []).map((it: any, i: number) => i === index ? { ...it, [field]: value } : it)
          setSection('education', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) : []))
          break
        }

        // Achievements
        case 'achievements/addItem': {
          const newItem = { title: '', description: '', date: '' }
          d.achievements = Array.isArray(d.achievements) ? [...d.achievements, newItem] : [newItem]
          setSection('achievements', (content: any[]) => Array.isArray(content) ? [...content, newItem] : [newItem])
          break
        }
        case 'achievements/removeItem': {
          const { index } = payload
          d.achievements = (Array.isArray(d.achievements) ? d.achievements : []).filter((_: any, i: number) => i !== index)
          setSection('achievements', (content: any[]) => (Array.isArray(content) ? content.filter((_: any, i: number) => i !== index) : []))
          break
        }
        case 'achievements/setField': {
          const { index, field, value } = payload
          d.achievements = (Array.isArray(d.achievements) ? d.achievements : []).map((it: any, i: number) => i === index ? { ...it, [field]: value } : it)
          setSection('achievements', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) : []))
          break
        }

        // Projects
        case 'projects/addItem': {
          const newItem = { name: '', url: '', description: '', highlights: [''] }
          setSection('projects', (content: any[]) => Array.isArray(content) ? [...content, newItem] : [newItem])
          break
        }
        case 'projects/removeItem': {
          const { index } = payload
          setSection('projects', (content: any[]) => (Array.isArray(content) ? content.filter((_: any, i: number) => i !== index) : []))
          break
        }
        case 'projects/setField': {
          const { index, field, value } = payload
          setSection('projects', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) : []))
          break
        }
        case 'projects/addHighlight': {
          const { index } = payload
          setSection('projects', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, highlights: [...(it.highlights || []), ''] } : it)) : []))
          break
        }
        case 'projects/removeHighlight': {
          const { index, highlightIndex } = payload
          setSection('projects', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, highlights: (it.highlights || []).filter((_: string, hi: number) => hi !== highlightIndex) } : it)) : []))
          break
        }
        case 'projects/setHighlight': {
          const { index, highlightIndex, text } = payload
          setSection('projects', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, highlights: (it.highlights || []).map((b: string, bi: number) => (bi === highlightIndex ? text : b)) } : it)) : []))
          break
        }

        // Certifications
        case 'certifications/addItem': {
          const newCert = { name: '', issuer: '', date: '', description: '' }
          d.certifications = Array.isArray(d.certifications) ? [...d.certifications, newCert] : [newCert]
          setSection('certifications', (content: any[]) => Array.isArray(content) ? [...content, newCert] : [newCert])
          break
        }
        case 'certifications/removeItem': {
          const { index } = payload
          d.certifications = (Array.isArray(d.certifications) ? d.certifications : []).filter((_: any, i: number) => i !== index)
          setSection('certifications', (content: any[]) => (Array.isArray(content) ? content.filter((_: any, i: number) => i !== index) : []))
          break
        }
        case 'certifications/setField': {
          const { index, field, value } = payload
          d.certifications = (Array.isArray(d.certifications) ? d.certifications : []).map((it: any, i: number) => i === index ? { ...it, [field]: value } : it)
          setSection('certifications', (content: any[]) => (Array.isArray(content) ? content.map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) : []))
          break
        }

        default:
          return
      }
      state.hasUnsavedChanges = true
    },
  }
})

export const {
  setAll,
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
  setSaving,
  setHasUnsaved,
  loadSuccess,
  applyOp,
} = slice.actions

export default slice.reducer


