import { call, put, select, takeEvery, throttle } from 'redux-saga/effects'
import { createResumeWithRefresh, getResumeWithRefresh, updateResumeWithRefresh, exportResumeBlobWithRefresh, importResumeFromPdfWithRefresh, aiSuggestBulletsWithRefresh, aiEnhanceTextWithRefresh } from '@/lib/api'
import { resumeEditorActions } from '@/features/resume-editor/state/resumeEditorSlice'
// import { useAuthToken } from '@/lib/auth'

// Helpers to access token in saga: simple bridge using window to avoid wiring context here
async function getToken(): Promise<string> {
  const w: any = typeof window !== 'undefined' ? window : {}
  if (typeof w.__getAuthToken === 'function') {
    // Wait for token to be ready on first load to avoid 401 loops
    return await w.__getAuthToken()
  }
  return ''
}

function* saveResume(_action: any): any {
  try {
    yield put(resumeEditorActions.setSaving(true))
    const state: any = yield select((s: any) => s.resume)
    const token: string = yield call(getToken)
    const toArray = (order: string[], entities: Record<string, any>) => (order || []).map((id: string) => entities[id]).filter(Boolean).map(({ id: _id, ...rest }: any) => rest)
    const experience = toArray(state.experienceOrder || [], state.experience?.entities || {})
    const education = toArray(state.educationOrder || [], state.education?.entities || {})
    const achievements = toArray(state.achievementsOrder || [], state.achievements?.entities || {})
    const projects = toArray(state.projectsOrder || [], state.projects?.entities || {})
    const certifications = toArray(state.certificationsOrder || [], state.certifications?.entities || {})
    const sections = (state.sectionOrder || []).map((id: string, i: number) => {
      const s = state.sections?.entities?.[id]
      if (!s) return null
      let content: any = []
      switch (s.type) {
        case 'summary': content = { text: state.summary || '' }; break
        case 'experience': content = experience; break
        case 'education': content = education; break
        case 'achievements': content = achievements; break
        case 'projects': content = projects; break
        case 'certifications': content = certifications; break
        case 'skills': content = { groups: [{ name: '', skills: state.skills || [] }] }; break
        default: content = []
      }
      return { id: s.id, type: s.type, title: s.title, order: i, content }
    }).filter(Boolean)

    const payload = {
      id: state.meta.id,
      name: state.meta.name,
      personal_info: state.personalInfo,
      summary: state.summary,
      experience,
      achievements,
      education,
      sections,
      template_id: state.meta.templateId,
      theme: { id: state.meta.themeId, font: state.meta.fontId },
      technologies: [{ name: '', skills: state.skills || [] }],
    }
    if (!payload.id) {
      const created: any = yield call(createResumeWithRefresh, payload, async () => token)
      yield put(resumeEditorActions.setMeta({ id: created.id }))
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/resumes/${created.id}`)
      }
    } else {
      yield call(updateResumeWithRefresh, payload.id as string, payload, async () => token)
    }
    yield put(resumeEditorActions.setHasUnsaved(false))
  } finally {
    yield put(resumeEditorActions.setSaving(false))
  }
}

function* loadResume(action: any): any {
  const resumeId: string = action.payload
  if (!resumeId || resumeId === 'new') return
  try {
    yield put(resumeEditorActions.setLoading(true))
    const token: string = yield call(getToken)
    const data: any = yield call(getResumeWithRefresh, resumeId, async () => token)
  // Hydrate normalized state
  yield put(resumeEditorActions.resetAll())
  yield put(resumeEditorActions.setMeta({ id: data.id, name: data.name || 'Untitled Resume', templateId: data.template_id || null, themeId: (data.theme?.id || 'minimal'), fontId: (data.theme?.font || 'inter') }))
  yield put(resumeEditorActions.setPersonalInfo(data.personal_info || {}))
  yield put(resumeEditorActions.setSummary(data.summary || ''))
  const skillsFromTech = Array.isArray(data?.technologies) ? (data.technologies.flatMap((g: any) => Array.isArray(g?.skills) ? g.skills : [])) : []
  yield put(resumeEditorActions.setSkills(skillsFromTech))
  const sections = Array.isArray(data?.sections) && data.sections.length ? data.sections : []
  const baseSections = sections.length ? sections : [{ id: 'summary', type: 'summary', title: 'Summary', order: 0 }]
  yield put(resumeEditorActions.hydrateSections({ sections: baseSections.map((s: any) => ({ id: s.id, type: s.type, title: s.title, order: s.order })) }))
  const exp = Array.isArray(data?.experience) ? data.experience : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'experience')?.content) : []) || [])
  const edu = Array.isArray(data?.education) ? data.education : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'education')?.content) : []) || [])
  const ach = Array.isArray(data?.achievements) ? data.achievements : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'achievements')?.content) : []) || [])
  const proj = (Array.isArray(sections) ? (sections.find((s: any) => s.type === 'projects')?.content) : []) || []
  const cert = (Array.isArray(sections) ? (sections.find((s: any) => s.type === 'certifications')?.content) : []) || []
  yield put(resumeEditorActions.hydrateExperience({ items: exp }))
  yield put(resumeEditorActions.hydrateEducation({ items: edu }))
  yield put(resumeEditorActions.hydrateAchievements({ items: ach }))
  yield put(resumeEditorActions.hydrateProjects({ items: proj }))
  yield put(resumeEditorActions.hydrateCertifications({ items: cert }))
  } finally {
    yield put(resumeEditorActions.setLoading(false))
  }
}

export default function* resumeSaga() {
  yield takeEvery('resume/LOAD_REQUEST', loadResume)
  yield throttle(1000, 'resume/SAVE_REQUEST', saveResume)
  yield takeEvery('resume/EXPORT_REQUEST', exportResume)
  yield takeEvery('resume/IMPORT_PDF_REQUEST', importPdf)
  yield takeEvery('resume/SUGGEST_BULLETS_REQUEST', suggestBullets)
  yield takeEvery('resume/ENHANCE_SUMMARY_REQUEST', enhanceSummary)
  yield takeEvery('resume/ENHANCE_BULLET_REQUEST', enhanceBullet)
}

function* exportResume(action: any): any {
  const format: 'pdf' | 'docx' = action?.payload?.format || 'pdf'
  try {
    yield put(resumeEditorActions.setExporting(true))
    const state: any = yield select((s: any) => s.resume)
    const pathId = (typeof window !== 'undefined') ? window.location.pathname.split('/').filter(Boolean).pop() : ''
    const resumeId: string = state?.meta?.id || (pathId && pathId !== 'new' ? pathId : '')
    if (!resumeId) return
    const token: string = yield call(getToken)
    const blob: Blob = yield call(exportResumeBlobWithRefresh, resumeId, format, async () => token)
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${String(state?.data?.name || 'resume')}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  } finally {
    yield put(resumeEditorActions.setExporting(false))
  }
}

function* importPdf(action: any): any {
  const file: File | undefined = action?.payload
  if (!file) return
  try {
    yield put(resumeEditorActions.setImporting(true))
    const token: string = yield call(getToken)
    const imported: any = yield call(importResumeFromPdfWithRefresh, async () => token, file)
    const normalized = {
      ...imported,
      theme: imported?.theme && imported.theme.id ? imported.theme : { ...(imported?.theme || {}), id: (imported?.theme?.id || 'minimal'), font: (imported?.theme?.font || 'inter') },
    }
    // Hydrate normalized editor state from imported resume
    yield put(resumeEditorActions.resetAll())
    yield put(resumeEditorActions.setMeta({ id: normalized.id, name: normalized.name || 'Untitled Resume', templateId: normalized.template_id || null, themeId: (normalized.theme?.id || 'minimal'), fontId: (normalized.theme?.font || 'inter') }))
    yield put(resumeEditorActions.setPersonalInfo(normalized.personal_info || {}))
    yield put(resumeEditorActions.setSummary(normalized.summary || ''))
    const skillsFromTech = Array.isArray(normalized?.technologies) ? (normalized.technologies.flatMap((g: any) => Array.isArray(g?.skills) ? g.skills : [])) : []
    yield put(resumeEditorActions.setSkills(skillsFromTech))
    const sections = Array.isArray(normalized?.sections) ? normalized.sections : []
    const baseSections = sections.length ? sections : [{ id: 'summary', type: 'summary', title: 'Summary', order: 0 }]
    yield put(resumeEditorActions.hydrateSections({ sections: baseSections.map((s: any) => ({ id: s.id, type: s.type, title: s.title, order: s.order })) }))
    const exp = Array.isArray(normalized?.experience) ? normalized.experience : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'experience')?.content) : []) || [])
    const edu = Array.isArray(normalized?.education) ? normalized.education : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'education')?.content) : []) || [])
    const ach = Array.isArray(normalized?.achievements) ? normalized.achievements : ((Array.isArray(sections) ? (sections.find((s: any) => s.type === 'achievements')?.content) : []) || [])
    const proj = (Array.isArray(sections) ? (sections.find((s: any) => s.type === 'projects')?.content) : []) || []
    const cert = (Array.isArray(sections) ? (sections.find((s: any) => s.type === 'certifications')?.content) : []) || []
    yield put(resumeEditorActions.hydrateExperience({ items: exp }))
    yield put(resumeEditorActions.hydrateEducation({ items: edu }))
    yield put(resumeEditorActions.hydrateAchievements({ items: ach }))
    yield put(resumeEditorActions.hydrateProjects({ items: proj }))
    yield put(resumeEditorActions.hydrateCertifications({ items: cert }))
  } finally {
    yield put(resumeEditorActions.setImporting(false))
  }
}

function* suggestBullets(action: any): any {
  const index: number = Number(action?.payload ?? -1)
  if (index < 0) return
  try {
    const state: any = yield select((s: any) => s.resume)
    const toArray = (order: string[], entities: Record<string, any>) => (order || []).map((id: string) => entities[id]).filter(Boolean)
    const exp = (toArray(state.experienceOrder, state.experience.entities) || [])[index]
    const token: string = yield call(getToken)
    const res: any = yield call(aiSuggestBulletsWithRefresh, state?.meta?.id, async () => token, { role: exp?.role || '' })
    const bullets: string[] = Array.isArray(res?.bullets)
      ? res.bullets
      : (typeof res?.text === 'string' ? res.text.split('\n').map((s: string) => s.replace(/^[-•\s]+/, '')).filter(Boolean) : [])
    if (!bullets.length) return
    yield put(resumeEditorActions.replaceExperienceBullets({ index, bullets }))
  } finally {
    // no-op
  }
}

function* enhanceSummary(action: any): any {
  const payload = action?.payload || {}
  const text: string = String(payload.text || '')
  const resolve: undefined | ((v: string) => void) = payload.resolve
  try {
    const state: any = yield select((s: any) => s.resume)
    const id: string | undefined = state?.meta?.id
    if (!id) { resolve?.(text); return }
    const token: string = yield call(getToken)
    const res: any = yield call(aiEnhanceTextWithRefresh, id, async () => token, { text, mode: 'rewrite', contentType: 'summary', tone: 'professional' })
    const next: string = typeof res?.text === 'string' ? res.text : text
    resolve?.(next)
  } catch {
    resolve?.(text)
  }
}

function* enhanceBullet(action: any): any {
  const payload = action?.payload || {}
  const text: string = String(payload.text || '')
  const resolve: undefined | ((v: string) => void) = payload.resolve
  try {
    const state: any = yield select((s: any) => s.resume)
    const id: string | undefined = state?.meta?.id
    if (!id) { resolve?.(text); return }
    const token: string = yield call(getToken)
    const res: any = yield call(aiEnhanceTextWithRefresh, id, async () => token, { text, mode: 'rewrite', contentType: 'bullet', tone: 'professional' })
    const next: string = typeof res?.text === 'string' ? res.text : text
    resolve?.(next)
  } catch {
    resolve?.(text)
  }
}


