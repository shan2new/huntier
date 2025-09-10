import { createSlice, createEntityAdapter, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type SectionEntity = { id: string; type: string; title: string; order: number }

export type NormalizedResumeState = {
  meta: { id: string | null; name: string; templateId: string | null; themeId: string; fontId: string }
  sections: ReturnType<typeof sectionsAdapter.getInitialState>
  sectionOrder: string[]
  experience: ReturnType<typeof experienceAdapter.getInitialState>
  experienceOrder: string[]
  education: ReturnType<typeof educationAdapter.getInitialState>
  educationOrder: string[]
  projects: ReturnType<typeof projectsAdapter.getInitialState>
  projectsOrder: string[]
  achievements: ReturnType<typeof achievementsAdapter.getInitialState>
  achievementsOrder: string[]
  certifications: ReturnType<typeof certificationsAdapter.getInitialState>
  certificationsOrder: string[]
  // denormalized fields kept for backward compatibility during migration
  personalInfo: any
  summary: string
  skills: string[]
  flags: { saving: boolean; hasUnsavedChanges: boolean; exporting: boolean; importing: boolean; loading: boolean }
}

const sectionsAdapter = createEntityAdapter<SectionEntity>({ sortComparer: (a, b) => a.order - b.order })
export type ExperienceEntity = { id: string; company: string; role: string; startDate: string; endDate: string; bullets: string[] }
const experienceAdapter = createEntityAdapter<ExperienceEntity>()
export type EducationEntity = { id: string; school: string; degree: string; field: string; startDate: string; endDate: string; gpa?: string }
const educationAdapter = createEntityAdapter<EducationEntity>()
export type ProjectEntity = { id: string; name: string; url: string; description: string; highlights: string[]; technologies?: string[] }
const projectsAdapter = createEntityAdapter<ProjectEntity>()
export type AchievementEntity = { id: string; title: string; description: string; date?: string }
const achievementsAdapter = createEntityAdapter<AchievementEntity>()
export type CertificationEntity = { id: string; name: string; issuer: string; date: string; description?: string }
const certificationsAdapter = createEntityAdapter<CertificationEntity>()

const initialState: NormalizedResumeState = {
  meta: { id: null, name: '', templateId: null, themeId: 'light', fontId: 'outfit' },
  sections: sectionsAdapter.getInitialState(),
  sectionOrder: [],
  experience: experienceAdapter.getInitialState(),
  experienceOrder: [],
  education: educationAdapter.getInitialState(),
  educationOrder: [],
  projects: projectsAdapter.getInitialState(),
  projectsOrder: [],
  achievements: achievementsAdapter.getInitialState(),
  achievementsOrder: [],
  certifications: certificationsAdapter.getInitialState(),
  certificationsOrder: [],
  personalInfo: {},
  summary: '',
  skills: [],
  flags: { saving: false, hasUnsavedChanges: false, exporting: false, importing: false, loading: false },
}

const slice = createSlice({
  name: 'resumeEditor',
  initialState,
  reducers: {
    resetAll() { return initialState },
    setMeta(state, action: PayloadAction<Partial<NormalizedResumeState['meta']>>) {
      Object.assign(state.meta, action.payload); state.flags.hasUnsavedChanges = true
    },
    setPersonalInfo(state, action: PayloadAction<Record<string, any>>) {
      state.personalInfo = { ...(action.payload || {}) }; state.flags.hasUnsavedChanges = true
    },
    setPersonalInfoField(state, action: PayloadAction<{ field: string; value: string }>) {
      const { field, value } = action.payload; state.personalInfo = { ...(state.personalInfo || {}), [field]: value }; state.flags.hasUnsavedChanges = true
    },
    setSummary(state, action: PayloadAction<string>) {
      state.summary = action.payload; state.flags.hasUnsavedChanges = true
    },
    setSkills(state, action: PayloadAction<string[]>) {
      state.skills = action.payload; state.flags.hasUnsavedChanges = true
    },
    hydrateSections(state, action: PayloadAction<{ sections: Array<{ id?: string; type: string; title: string; order?: number }> }>) {
      const items = (action.payload.sections || []).map((s, i) => ({ id: s.id || nanoid(), type: s.type, title: s.title, order: typeof s.order === 'number' ? s.order : i }))
      sectionsAdapter.setAll(state.sections, items)
      state.sectionOrder = items.sort((a, b) => a.order - b.order).map((x) => x.id)
    },
    ensureSeeded(state) {
      if ((state.sectionOrder || []).length > 0) return
      const seed: Array<SectionEntity> = [
        { id: nanoid(), type: 'summary', title: 'Summary', order: 0 },
        { id: nanoid(), type: 'experience', title: 'Experience', order: 1 },
        { id: nanoid(), type: 'education', title: 'Education', order: 2 },
        { id: nanoid(), type: 'skills', title: 'Skills', order: 3 },
      ]
      sectionsAdapter.setAll(state.sections, seed)
      state.sectionOrder = seed.map((s) => s.id)
    },
    addSection(state, action: PayloadAction<{ type: string; title: string }>) {
      const id = nanoid()
      const order = state.sectionOrder.length
      sectionsAdapter.addOne(state.sections, { id, type: action.payload.type, title: action.payload.title, order })
      state.sectionOrder.push(id)
      state.flags.hasUnsavedChanges = true
    },
    removeSection(state, action: PayloadAction<{ id: string }>) {
      sectionsAdapter.removeOne(state.sections, action.payload.id)
      state.sectionOrder = state.sectionOrder.filter((sid) => sid !== action.payload.id)
      state.flags.hasUnsavedChanges = true
    },
    reorderSections(state, action: PayloadAction<{ order: string[] }>) {
      state.sectionOrder = action.payload.order; state.flags.hasUnsavedChanges = true
    },
    setSaving(state, action: PayloadAction<boolean>) { state.flags.saving = action.payload },
    setExporting(state, action: PayloadAction<boolean>) { state.flags.exporting = action.payload },
    setImporting(state, action: PayloadAction<boolean>) { state.flags.importing = action.payload },
    setLoading(state, action: PayloadAction<boolean>) { state.flags.loading = action.payload },
    setHasUnsaved(state, action: PayloadAction<boolean>) { state.flags.hasUnsavedChanges = action.payload },

    // Experience (normalized)
    hydrateExperience(state, action: PayloadAction<{ items: Array<Partial<ExperienceEntity>> }>) {
      const items = (action.payload.items || []).map((it) => ({
        id: nanoid(),
        company: String(it.company || ''),
        role: String(it.role || ''),
        startDate: String(it.startDate || ''),
        endDate: String(it.endDate || ''),
        bullets: Array.isArray(it.bullets) ? it.bullets.map((b) => String(b)) : [],
      }))
      experienceAdapter.setAll(state.experience, items)
      state.experienceOrder = items.map((it) => it.id)
    },
    addExperienceItem(state) {
      const id = nanoid()
      const entity: ExperienceEntity = { id, company: '', role: '', startDate: '', endDate: '', bullets: [''] }
      experienceAdapter.addOne(state.experience, entity)
      state.experienceOrder.push(id)
      state.flags.hasUnsavedChanges = true
    },
    removeExperienceItem(state, action: PayloadAction<{ index: number }>) {
      const id = state.experienceOrder[action.payload.index]
      if (!id) return
      experienceAdapter.removeOne(state.experience, id)
      state.experienceOrder = state.experienceOrder.filter((x) => x !== id)
      state.flags.hasUnsavedChanges = true
    },
    setExperienceField(state, action: PayloadAction<{ index: number; field: keyof Omit<ExperienceEntity, 'id' | 'bullets'>; value: string }>) {
      const id = state.experienceOrder[action.payload.index]
      if (!id) return
      experienceAdapter.updateOne(state.experience, { id, changes: { [action.payload.field]: action.payload.value } as any })
      state.flags.hasUnsavedChanges = true
    },
    addExperienceBullet(state, action: PayloadAction<{ index: number }>) {
      const id = state.experienceOrder[action.payload.index]
      const entity = id ? state.experience.entities[id] : undefined
      if (!entity) return
      experienceAdapter.updateOne(state.experience, { id, changes: { bullets: [...(entity.bullets || []), ''] } })
      state.flags.hasUnsavedChanges = true
    },
    removeExperienceBullet(state, action: PayloadAction<{ index: number; bulletIndex: number }>) {
      const id = state.experienceOrder[action.payload.index]
      const entity = id ? state.experience.entities[id] : undefined
      if (!entity) return
      experienceAdapter.updateOne(state.experience, { id, changes: { bullets: (entity.bullets || []).filter((_, i) => i !== action.payload.bulletIndex) } })
      state.flags.hasUnsavedChanges = true
    },
    setExperienceBullet(state, action: PayloadAction<{ index: number; bulletIndex: number; text: string }>) {
      const id = state.experienceOrder[action.payload.index]
      const entity = id ? state.experience.entities[id] : undefined
      if (!entity) return
      const next = (entity.bullets || []).map((b, i) => (i === action.payload.bulletIndex ? action.payload.text : b))
      experienceAdapter.updateOne(state.experience, { id, changes: { bullets: next } })
      state.flags.hasUnsavedChanges = true
    },
    replaceExperienceBullets(state, action: PayloadAction<{ index: number; bullets: string[] }>) {
      const id = state.experienceOrder[action.payload.index]
      const entity = id ? state.experience.entities[id] : undefined
      if (!entity) return
      experienceAdapter.updateOne(state.experience, { id, changes: { bullets: action.payload.bullets } })
      state.flags.hasUnsavedChanges = true
    },

    // Education
    hydrateEducation(state, action: PayloadAction<{ items: Array<Partial<EducationEntity>> }>) {
      const items = (action.payload.items || []).map((it) => ({
        id: nanoid(), school: String(it.school || ''), degree: String(it.degree || ''), field: String(it.field || ''), startDate: String(it.startDate || ''), endDate: String(it.endDate || ''), gpa: it.gpa ? String(it.gpa) : undefined,
      }))
      educationAdapter.setAll(state.education, items)
      state.educationOrder = items.map((it) => it.id)
    },
    addEducationItem(state) {
      const id = nanoid(); const entity: EducationEntity = { id, school: '', degree: '', field: '', startDate: '', endDate: '' }
      educationAdapter.addOne(state.education, entity); state.educationOrder.push(id); state.flags.hasUnsavedChanges = true
    },
    removeEducationItem(state, action: PayloadAction<{ index: number }>) {
      const id = state.educationOrder[action.payload.index]; if (!id) return
      educationAdapter.removeOne(state.education, id); state.educationOrder = state.educationOrder.filter((x) => x !== id); state.flags.hasUnsavedChanges = true
    },
    setEducationField(state, action: PayloadAction<{ index: number; field: keyof Omit<EducationEntity, 'id'>; value: string }>) {
      const id = state.educationOrder[action.payload.index]; if (!id) return
      educationAdapter.updateOne(state.education, { id, changes: { [action.payload.field]: action.payload.value } as any }); state.flags.hasUnsavedChanges = true
    },

    // Achievements
    hydrateAchievements(state, action: PayloadAction<{ items: Array<Partial<AchievementEntity>> }>) {
      const items = (action.payload.items || []).map((it) => ({ id: nanoid(), title: String(it.title || ''), description: String(it.description || ''), date: it.date ? String(it.date) : undefined }))
      achievementsAdapter.setAll(state.achievements, items); state.achievementsOrder = items.map((it) => it.id)
    },
    addAchievementItem(state) { const id = nanoid(); const entity: AchievementEntity = { id, title: '', description: '' }; achievementsAdapter.addOne(state.achievements, entity); state.achievementsOrder.push(id); state.flags.hasUnsavedChanges = true },
    removeAchievementItem(state, action: PayloadAction<{ index: number }>) { const id = state.achievementsOrder[action.payload.index]; if (!id) return; achievementsAdapter.removeOne(state.achievements, id); state.achievementsOrder = state.achievementsOrder.filter((x) => x !== id); state.flags.hasUnsavedChanges = true },
    setAchievementField(state, action: PayloadAction<{ index: number; field: keyof Omit<AchievementEntity, 'id'>; value: string }>) { const id = state.achievementsOrder[action.payload.index]; if (!id) return; achievementsAdapter.updateOne(state.achievements, { id, changes: { [action.payload.field]: action.payload.value } as any }); state.flags.hasUnsavedChanges = true },

    // Projects
    hydrateProjects(state, action: PayloadAction<{ items: Array<Partial<ProjectEntity>> }>) {
      const items = (action.payload.items || []).map((it) => ({ id: nanoid(), name: String(it.name || ''), url: String(it.url || ''), description: String(it.description || ''), highlights: Array.isArray(it.highlights) ? it.highlights.map((h) => String(h)) : [] }))
      projectsAdapter.setAll(state.projects, items); state.projectsOrder = items.map((it) => it.id)
    },
    addProjectItem(state) { const id = nanoid(); const entity: ProjectEntity = { id, name: '', url: '', description: '', highlights: [''] }; projectsAdapter.addOne(state.projects, entity); state.projectsOrder.push(id); state.flags.hasUnsavedChanges = true },
    removeProjectItem(state, action: PayloadAction<{ index: number }>) { const id = state.projectsOrder[action.payload.index]; if (!id) return; projectsAdapter.removeOne(state.projects, id); state.projectsOrder = state.projectsOrder.filter((x) => x !== id); state.flags.hasUnsavedChanges = true },
    setProjectField(state, action: PayloadAction<{ index: number; field: keyof Omit<ProjectEntity, 'id' | 'highlights'>; value: string }>) { const id = state.projectsOrder[action.payload.index]; if (!id) return; projectsAdapter.updateOne(state.projects, { id, changes: { [action.payload.field]: action.payload.value } as any }); state.flags.hasUnsavedChanges = true },
    addProjectHighlight(state, action: PayloadAction<{ index: number }>) { const id = state.projectsOrder[action.payload.index]; const entity = id ? state.projects.entities[id] : undefined; if (!entity) return; projectsAdapter.updateOne(state.projects, { id, changes: { highlights: [...(entity.highlights || []), ''] } }); state.flags.hasUnsavedChanges = true },
    removeProjectHighlight(state, action: PayloadAction<{ index: number; highlightIndex: number }>) { const id = state.projectsOrder[action.payload.index]; const entity = id ? state.projects.entities[id] : undefined; if (!entity) return; projectsAdapter.updateOne(state.projects, { id, changes: { highlights: (entity.highlights || []).filter((_, i) => i !== action.payload.highlightIndex) } }); state.flags.hasUnsavedChanges = true },
    setProjectHighlight(state, action: PayloadAction<{ index: number; highlightIndex: number; text: string }>) { const id = state.projectsOrder[action.payload.index]; const entity = id ? state.projects.entities[id] : undefined; if (!entity) return; const next = (entity.highlights || []).map((h, i) => (i === action.payload.highlightIndex ? action.payload.text : h)); projectsAdapter.updateOne(state.projects, { id, changes: { highlights: next } }); state.flags.hasUnsavedChanges = true },

    // Certifications
    hydrateCertifications(state, action: PayloadAction<{ items: Array<Partial<CertificationEntity>> }>) { const items = (action.payload.items || []).map((it) => ({ id: nanoid(), name: String(it.name || ''), issuer: String(it.issuer || ''), date: String(it.date || ''), description: it.description ? String(it.description) : '' })); certificationsAdapter.setAll(state.certifications, items); state.certificationsOrder = items.map((it) => it.id) },
    addCertificationItem(state) { const id = nanoid(); const entity: CertificationEntity = { id, name: '', issuer: '', date: '', description: '' }; certificationsAdapter.addOne(state.certifications, entity); state.certificationsOrder.push(id); state.flags.hasUnsavedChanges = true },
    removeCertificationItem(state, action: PayloadAction<{ index: number }>) { const id = state.certificationsOrder[action.payload.index]; if (!id) return; certificationsAdapter.removeOne(state.certifications, id); state.certificationsOrder = state.certificationsOrder.filter((x) => x !== id); state.flags.hasUnsavedChanges = true },
    setCertificationField(state, action: PayloadAction<{ index: number; field: keyof Omit<CertificationEntity, 'id'>; value: string }>) { const id = state.certificationsOrder[action.payload.index]; if (!id) return; certificationsAdapter.updateOne(state.certifications, { id, changes: { [action.payload.field]: action.payload.value } as any }); state.flags.hasUnsavedChanges = true },
  }
})

export const sectionsSelectors = sectionsAdapter.getSelectors<{
  resumeEditor: NormalizedResumeState
}>((s) => s.resumeEditor.sections)

export const resumeEditorActions = slice.actions
export default slice.reducer


