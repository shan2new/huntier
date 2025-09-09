import { useDispatch, useSelector } from 'react-redux'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { sectionRegistry } from '../plugins'
import { registerExperiencePlugin } from '../plugins/experience.plugin'
import { selectResumeOutline, selectMeta, selectExperienceItems, selectEducationItems, selectAchievementItems, selectProjectItems, selectCertificationItems, selectPersonalInfo, selectSummary, selectSkills } from '../state/selectors'
import { resumeEditorActions } from '../state/resumeEditorSlice'

export function useResumeCopilotBindings() {
  const dispatch = useDispatch()
  const meta = useSelector(selectMeta)
  const sections = useSelector(selectResumeOutline)
  const personalInfo = useSelector(selectPersonalInfo) as any
  const summary = useSelector(selectSummary) as string
  const skills = useSelector(selectSkills) as string[]
  const expItems = useSelector(selectExperienceItems) as any[]
  const eduItems = useSelector(selectEducationItems) as any[]
  const achItems = useSelector(selectAchievementItems) as any[]
  const projItems = useSelector(selectProjectItems) as any[]
  const certItems = useSelector(selectCertificationItems) as any[]

  useCopilotReadable({ description: 'resume_meta', value: { name: meta?.name, id: meta?.id } })
  useCopilotReadable({ description: 'resume_outline', value: sections })

  // Full normalized view for the assistant (trim ids for brevity)
  const expPlain = (expItems || []).map(({ id: _id, ...rest }) => rest)
  const eduPlain = (eduItems || []).map(({ id: _id, ...rest }) => rest)
  const achPlain = (achItems || []).map(({ id: _id, ...rest }) => rest)
  const projPlain = (projItems || []).map(({ id: _id, ...rest }) => rest)
  const certPlain = (certItems || []).map(({ id: _id, ...rest }) => rest)

  useCopilotReadable({
    description: 'resume_full',
    value: {
      id: meta?.id,
      name: meta?.name,
      templateId: meta?.templateId,
      themeId: meta?.themeId,
      fontId: meta?.fontId,
      personalInfo,
      summary,
      skills,
      experience: expPlain,
      education: eduPlain,
      achievements: achPlain,
      projects: projPlain,
      certifications: certPlain,
    },
  })

  // register plugins (experience only for now)
  registerExperiencePlugin(sectionRegistry, dispatch)

  const tools = sectionRegistry['experience']?.copilot?.tools || []
  tools.forEach((tool) => {
    useCopilotAction({ name: tool.name, description: tool.description, parameters: tool.parameters as any, handler: tool.handler as any }, undefined)
  })

  // Bulk edits across sections
  useCopilotAction(
    {
      name: 'apply_resume_changes',
      description: 'Apply multiple changes to the resume in one request. Supports summary, skills, personalInfo, experience, education, achievements, projects, certifications. Use replace for lists.',
      parameters: [
        { name: 'ops', type: 'object[]', description: 'Array of operations. op={ target, action, value }', required: true },
      ],
      handler: async (args: any) => {
        const ops = Array.isArray(args?.ops) ? args.ops : []
        for (const op of ops) {
          const target = String(op?.target || '').toLowerCase()
          const action = String(op?.action || 'set').toLowerCase()
          const value = op?.value
          switch (target) {
            case 'summary':
              if (typeof value === 'string') dispatch(resumeEditorActions.setSummary(value))
              break
            case 'skills': {
              const arr = Array.isArray(value) ? value.map((s: any) => String(s)).filter(Boolean) : []
              dispatch(resumeEditorActions.setSkills(arr))
              break
            }
            case 'personalinfo': {
              if (value && typeof value === 'object') {
                dispatch(resumeEditorActions.setPersonalInfo(value))
              }
              break
            }
            case 'experience': {
              const items = Array.isArray(value) ? value : []
              if (action === 'replace') dispatch(resumeEditorActions.hydrateExperience({ items }))
              break
            }
            case 'education': {
              const items = Array.isArray(value) ? value : []
              if (action === 'replace') dispatch(resumeEditorActions.hydrateEducation({ items }))
              break
            }
            case 'achievements': {
              const items = Array.isArray(value) ? value : []
              if (action === 'replace') dispatch(resumeEditorActions.hydrateAchievements({ items }))
              break
            }
            case 'projects': {
              const items = Array.isArray(value) ? value : []
              if (action === 'replace') dispatch(resumeEditorActions.hydrateProjects({ items }))
              break
            }
            case 'certifications': {
              const items = Array.isArray(value) ? value : []
              if (action === 'replace') dispatch(resumeEditorActions.hydrateCertifications({ items }))
              break
            }
            case 'meta': {
              if (value && typeof value === 'object') dispatch(resumeEditorActions.setMeta(value))
              break
            }
            default:
              break
          }
        }
        // optionally let caller decide to save explicitly
      },
    },
    undefined,
  )

  useCopilotAction(
    {
      name: 'save_resume',
      description: 'Persist current resume to the server.',
      handler: async () => { dispatch({ type: 'resume/SAVE_REQUEST' }) },
    },
    undefined,
  )

  // Focused, reliable tools the model can use
  useCopilotAction(
    {
      name: 'replace_experience_bullets',
      description: 'Replace bullets for a specific experience by index or company match. If both provided, index wins.',
      parameters: [
        { name: 'index', type: 'number', description: '0-based index of the experience item', required: false },
        { name: 'company', type: 'string', description: 'Company name to match (case-insensitive substring)', required: false },
        { name: 'bullets', type: 'string[]', description: 'New bullet list to set', required: true },
        { name: 'save', type: 'boolean', description: 'If true, saves after applying', required: false },
      ],
      handler: async (args: any) => {
        const proposed = Array.isArray(args?.bullets) ? args.bullets.map((s: any) => String(s)).filter(Boolean) : []
        if (!proposed.length) return
        let idx = typeof args?.index === 'number' ? args.index : -1
        if (idx < 0 && typeof args?.company === 'string') {
          const key = String(args.company).toLowerCase()
          idx = (expItems || []).findIndex((it: any) => String(it.company || '').toLowerCase().includes(key))
        }
        if (idx < 0) return
        dispatch(resumeEditorActions.replaceExperienceBullets({ index: idx, bullets: proposed }))
        if (args?.save) dispatch({ type: 'resume/SAVE_REQUEST' })
      },
    },
    undefined,
  )

  useCopilotAction(
    {
      name: 'set_experience_field',
      description: 'Set a single field on an experience item by index or company match. Fields: company, role, startDate, endDate.',
      parameters: [
        { name: 'index', type: 'number', description: '0-based index of the experience item', required: false },
        { name: 'company', type: 'string', description: 'Company name to match (case-insensitive substring)', required: false },
        { name: 'field', type: 'string', description: 'Field to set', required: true },
        { name: 'value', type: 'string', description: 'Value to assign', required: true },
        { name: 'save', type: 'boolean', description: 'If true, saves after applying', required: false },
      ],
      handler: async (args: any) => {
        let idx = typeof args?.index === 'number' ? args.index : -1
        if (idx < 0 && typeof args?.company === 'string') {
          const key = String(args.company).toLowerCase()
          idx = (expItems || []).findIndex((it: any) => String(it.company || '').toLowerCase().includes(key))
        }
        const field = String(args?.field || '') as any
        const value = String(args?.value || '')
        if (idx < 0 || !field) return
        dispatch(resumeEditorActions.setExperienceField({ index: idx, field, value }))
        if (args?.save) dispatch({ type: 'resume/SAVE_REQUEST' })
      },
    },
    undefined,
  )

  useCopilotAction(
    {
      name: 'apply_summary_update',
      description: 'Replace the professional summary with the proposed text.',
      parameters: [
        { name: 'proposed', type: 'string', description: 'New summary text', required: true },
        { name: 'save', type: 'boolean', description: 'If true, saves after applying', required: false },
      ],
      handler: async (args: any) => {
        const text = String(args?.proposed || '')
        if (!text) return
        dispatch(resumeEditorActions.setSummary(text))
        if (args?.save) dispatch({ type: 'resume/SAVE_REQUEST' })
      },
    },
    undefined,
  )

  useCopilotAction(
    {
      name: 'apply_skills_update',
      description: 'Replace skills with the provided list (dedupe yourself if needed).',
      parameters: [
        { name: 'proposed', type: 'string[]', description: 'New skills list', required: true },
        { name: 'save', type: 'boolean', description: 'If true, saves after applying', required: false },
      ],
      handler: async (args: any) => {
        const arr = Array.isArray(args?.proposed) ? args.proposed.map((s: any) => String(s)).filter(Boolean) : []
        if (!arr.length) return
        dispatch(resumeEditorActions.setSkills(arr))
        if (args?.save) dispatch({ type: 'resume/SAVE_REQUEST' })
      },
    },
    undefined,
  )
}


