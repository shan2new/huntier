import { useEffect, useMemo, useRef } from 'react'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useUser } from '@clerk/clerk-react'
import { toast } from '@/components/ui/toaster'
import { useAuthToken } from '@/lib/auth'
import {
  aiEnhanceTextWithRefresh,
  aiGenerateResumeFromProfileWithRefresh,
  aiSuggestBulletsWithRefresh,
  createResumeWithRefresh,
  getProfileWithRefresh,
  getResumeWithRefresh,
  updateResumeWithRefresh,
} from '@/lib/api'
import type { ResumeThemeId } from '@/lib/themes'
import {
  buildSectionsFromData,
  deriveSkillsTags,
  ensureSectionsWithSummary,
  setSkillsFromTags as domainSetSkillsFromTags,
} from '@/lib/resume-domain'

type ExperienceField = 'company' | 'role' | 'startDate' | 'endDate'

const DEFAULT_THEME_ID: ResumeThemeId = 'minimal'

function createInitialResumeData(isNew: boolean) {
  return {
    id: undefined as string | undefined,
    name: isNew ? 'Untitled Resume' : 'My Resume',
    personal_info: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      photoUrl: ''
    },
    summary: '',
    experience: [] as Array<any>,
    achievements: [] as Array<any>,
    leadership: [] as Array<any>,
    education: [] as Array<any>,
    technologies: [] as Array<any>,
    certifications: [] as Array<any>,
    additional_section: [] as Array<any>,
    sections: [] as Array<any>,
    template_id: null as string | null,
    theme: { font: 'Inter', size: 'md', accent: 'zinc', id: DEFAULT_THEME_ID as ResumeThemeId },
  }
}

export function useResumeState(resumeId: string) {
  const isNew = resumeId === 'new'
  const { getToken } = useAuthToken()
  const { user } = useUser()

  // Atoms scoped per hook instance
  const resumeAtom = useMemo(() => atom<any>(createInitialResumeData(isNew)), [isNew])
  const [resumeData, setResumeData] = useAtom(resumeAtom)
  const savingAtom = useMemo(() => atom<boolean>(false), [])
  const [saving, setSaving] = useAtom(savingAtom)
  const hasUnsavedAtom = useMemo(() => atom<boolean>(false), [])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useAtom(hasUnsavedAtom)
  const exportingAtom = useMemo(() => atom<boolean>(false), [])
  const [exporting, setExporting] = useAtom(exportingAtom)
  const importingAtom = useMemo(() => atom<boolean>(false), [])
  const [importing, setImporting] = useAtom(importingAtom)
  const autoImportAttemptedAtom = useMemo(() => atom<boolean>(false), [])
  const [autoImportAttempted, setAutoImportAttempted] = useAtom(autoImportAttemptedAtom)

  // Derived tags
  const skillsTagsAtom = useMemo(() => atom((get) => deriveSkillsTags({ sections: get(resumeAtom).sections, technologies: get(resumeAtom).technologies })), [resumeAtom])
  const skillsTags = useAtomValue(skillsTagsAtom)

  // Refs for Copilot helpers
  const summaryRef = useRef<string>('')
  const experienceRef = useRef<Array<any>>([])
  const educationRef = useRef<Array<any>>([])
  const achievementsRef = useRef<Array<any>>([])
  const certificationsRef = useRef<Array<any>>([])

  useEffect(() => {
    summaryRef.current = String(resumeData.summary || '')
    experienceRef.current = Array.isArray(resumeData.experience) ? resumeData.experience : []
    educationRef.current = Array.isArray(resumeData.education) ? resumeData.education : []
    achievementsRef.current = Array.isArray(resumeData.achievements) ? resumeData.achievements : []
    certificationsRef.current = Array.isArray((resumeData as any).certifications) ? (resumeData as any).certifications : []
  }, [resumeData])

  // Seed sections once
  useEffect(() => {
    setResumeData((prev: any) => {
      if ((prev.sections).length > 0) return prev
      const base = buildSectionsFromData(prev)
      return { ...prev, sections: base }
    })
  }, [setResumeData])

  // Load resume when editing existing
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      try {
        const data = await getResumeWithRefresh(resumeId, getToken)
        const d: any = data || {}
        setResumeData({
          id: d.id,
          name: d.name || 'Untitled Resume',
          personal_info: d.personal_info || {},
          summary: d.summary || '',
          experience: d.experience || [],
          achievements: d.achievements || [],
          leadership: d.leadership || [],
          education: d.education || [],
          technologies: d.technologies || [],
          certifications: (Array.isArray(d.sections) ? (d.sections.find((s: any) => s.type === 'certifications')?.content || []) : []),
          additional_section: d.additional_section || [],
          sections: (Array.isArray(d.sections) && d.sections.length > 0) ? d.sections : buildSectionsFromData(d),
          template_id: d.template_id || null,
          theme: (d.theme && typeof d.theme === 'object')
            ? { ...d.theme, id: (d.theme && typeof d.theme.id === 'string') ? d.theme.id : DEFAULT_THEME_ID }
            : { font: 'Inter', size: 'md', accent: 'zinc', id: DEFAULT_THEME_ID },
        })
      } catch (e) {
        console.error('Failed to load resume', e)
      }
    })()
  }, [resumeId, getToken, isNew, setResumeData])

  // Prefill personal info from Clerk user
  useEffect(() => {
    if (!user) return
    setResumeData((prev: any) => {
      const nextPersonal = {
        ...prev.personal_info,
        fullName: prev.personal_info.fullName || (user.fullName || ''),
        email: prev.personal_info.email || (user.primaryEmailAddress?.emailAddress || ''),
        photoUrl: prev.personal_info.photoUrl || (user.imageUrl || ''),
      }
      if (
        nextPersonal.fullName === prev.personal_info.fullName &&
        nextPersonal.email === prev.personal_info.email &&
        nextPersonal.photoUrl === prev.personal_info.photoUrl
      ) {
        return prev
      }
      return { ...prev, personal_info: nextPersonal }
    })
  }, [user, setResumeData])

  // Auto-save when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !resumeData.id) return
    const timer = setTimeout(() => {
      void handleSave(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, resumeData.id])

  // Mark unsaved on any data change (skip while saving)
  useEffect(() => {
    if (saving) return
    if (resumeData.id) setHasUnsavedChanges(true)
  }, [resumeData, saving, setHasUnsavedChanges])

  // Attempt AI seed when creating new resume
  useEffect(() => {
    if (autoImportAttempted) return
    if (!isNew) return
    setAutoImportAttempted(true)
    ;(async () => {
      try {
        const profile = await getProfileWithRefresh<any>(getToken)
        const aiSeed: any = await aiGenerateResumeFromProfileWithRefresh(getToken, profile)
        if (aiSeed && typeof aiSeed === 'object') {
          setResumeData((prev: any) => {
            const nextSummary = (typeof aiSeed.summary === 'string' && aiSeed.summary) ? aiSeed.summary : prev.summary
            const aiSections = Array.isArray(aiSeed?.sections) && aiSeed.sections.length ? aiSeed.sections : prev.sections
            const sectionsWithSummary = ensureSectionsWithSummary(aiSections as any, nextSummary)
            return {
              ...prev,
              personal_info: { ...prev.personal_info, ...(aiSeed?.personal_info || {}) },
              summary: nextSummary,
              experience: Array.isArray(aiSeed?.sections)
                ? ((aiSeed.sections.find((s: any) => s.type === 'experience')?.content) || prev.experience)
                : prev.experience,
              education: Array.isArray(aiSeed?.education) ? aiSeed.education : prev.education,
              technologies: Array.isArray(aiSeed?.technologies) ? aiSeed.technologies : prev.technologies,
              sections: sectionsWithSummary,
            }
          })
        }
      } catch {}
    })()
  }, [isNew, autoImportAttempted, getToken, setResumeData, setAutoImportAttempted])

  const handleSave = async (showNotification = true) => {
    try {
      setSaving(true)
      const payload = {
        name: resumeData.name,
        personal_info: resumeData.personal_info,
        summary: resumeData.summary,
        experience: resumeData.experience,
        achievements: resumeData.achievements,
        leadership: resumeData.leadership,
        education: resumeData.education,
        technologies: resumeData.technologies,
        sections: resumeData.sections,
        additional_section: (resumeData as any).additional_section,
        template_id: resumeData.template_id,
        theme: resumeData.theme,
      }
      if (isNew) {
        const created = await createResumeWithRefresh(payload, getToken)
        setResumeData((prev: any) => ({ ...prev, id: (created as any).id }))
        // Update URL to the new id
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', `/resumes/${(created as any).id}`)
        }
      } else if (resumeData.id) {
        await updateResumeWithRefresh(resumeData.id, payload, getToken)
      }
      setHasUnsavedChanges(false)
    } catch (e) {
      console.error('Failed to save resume', e)
      if (showNotification) {
        toast.error('Failed to save resume', {
          description: 'Please check your connection and try again.',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  // Top-level setters
  const setName = (name: string) => setResumeData((prev: any) => ({ ...prev, name }))
  const setTemplateId = (tid: string | null) => setResumeData((prev: any) => ({ ...prev, template_id: tid }))
  const setFontId = (fid: string) => setResumeData((prev: any) => ({ ...prev, theme: { ...prev.theme, font: fid } }))
  const setThemeId = (id: ResumeThemeId) => setResumeData((prev: any) => ({ ...prev, theme: { ...prev.theme, id } }))

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }))
  }

  // Skills helpers
  const setSkillsFromTags = (tags: Array<string>) => {
    setResumeData((prev: any) => domainSetSkillsFromTags(prev, tags))
  }

  const setSummaryText = (text: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      summary: text,
      sections: (prev.sections).map((s: any) => (s.type === 'summary' ? { ...s, content: { text } } : s)),
    }))
  }

  // Projects handlers
  const addProjectItem = () => {
    const newItem = { name: '', url: '', description: '', highlights: [''] }
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections)
        .map((s: any) => (s.type === 'projects'
          ? { ...s, content: (Array.isArray(s.content) ? [...s.content, newItem] : [newItem]) }
          : s))
        .concat((prev.sections).some((s: any) => s.type === 'projects') ? [] : [{ id: 'projects', type: 'projects', title: 'Projects', order: (prev.sections).length, content: [newItem] }])
    }))
  }
  const removeProjectItem = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections).map((s: any) => (s.type === 'projects' ? { ...s, content: (s.content as Array<any>).filter((_: any, i: number) => i !== index) } : s)),
    }))
  }
  const setProjectField = (index: number, field: string, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections).map((s: any) => (s.type === 'projects'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) }
        : s)),
    }))
  }
  const addProjectHighlight = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections).map((s: any) => (s.type === 'projects'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, highlights: [...(it.highlights || []), ''] } : it)) }
        : s)),
    }))
  }
  const removeProjectHighlight = (index: number, highlightIndex: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections).map((s: any) => (s.type === 'projects'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, highlights: (it.highlights || []).filter((_: string, hi: number) => hi !== highlightIndex) } : it)) }
        : s)),
    }))
  }
  const setProjectHighlight = (index: number, highlightIndex: number, text: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      sections: (prev.sections).map((s: any) => (s.type === 'projects'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, highlights: (it.highlights || []).map((b: string, bi: number) => (bi === highlightIndex ? text : b)) } : it)) }
        : s)),
    }))
  }

  // AI helpers
  const enhanceSummary = async (current: string) => {
    try {
      if (!resumeData.id) return current
      const result: any = await aiEnhanceTextWithRefresh(resumeData.id, getToken, {
        text: current,
        mode: 'rewrite',
        contentType: 'summary',
        tone: 'professional',
      })
      const next = (typeof result?.text === 'string' ? result.text : current)
      return next
    } catch {
      return current
    }
  }

  const setExperienceField = (index: number, field: ExperienceField, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'experience'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) }
        : s)),
    }))
  }

  const setExperienceBullet = (index: number, bulletIndex: number, text: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).map((item: any, i: number) => (i === index ? { ...item, bullets: (item.bullets || []).map((b: string, bi: number) => (bi === bulletIndex ? text : b)) } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'experience'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, bullets: (it.bullets || []).map((b: string, bi: number) => (bi === bulletIndex ? text : b)) } : it)) }
        : s)),
    }))
  }

  const replaceExperienceBullets = (index: number, bullets: Array<string>) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).map((item: any, i: number) => (i === index ? { ...item, bullets } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'experience'
        ? { ...s, content: (s.content as Array<any>).map((item: any, i: number) => (i === index ? { ...item, bullets } : item)) }
        : s)),
    }))
  }

  const enhanceExperienceBullet = async (_index: number, _bulletIndex: number, current: string) => {
    try {
      if (!resumeData.id) return current
      const result: any = await aiEnhanceTextWithRefresh(resumeData.id, getToken, {
        text: current,
        mode: 'rewrite',
        contentType: 'bullet',
        tone: 'professional',
      })
      const next = (typeof result?.text === 'string' ? result.text : current)
      return next
    } catch {
      return current
    }
  }

  const addExperienceItem = () => {
    const newExp = { company: '', role: '', startDate: '', endDate: '', bullets: [''] }
    setResumeData((prev: any) => ({
      ...prev,
      experience: [...(prev.experience), newExp],
      sections: (prev.sections).map((s: any) => (s.type === 'experience' ? { ...s, content: [...((s.content as Array<any>)), newExp] } : s)),
    }))
  }

  const removeExperienceItem = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).filter((_: any, i: number) => i !== index),
      sections: (prev.sections).map((s: any) => (s.type === 'experience' ? { ...s, content: (s.content as Array<any>).filter((_: any, i: number) => i !== index) } : s)),
    }))
  }

  const addExperienceBullet = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).map((item: any, i: number) => (i === index ? { ...item, bullets: [...(item.bullets || []), ''] } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'experience' ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, bullets: [...(it.bullets || []), ''] } : it)) } : s)),
    }))
  }

  const removeExperienceBullet = (index: number, bulletIndex: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      experience: (prev.experience).map((item: any, i: number) => (i === index ? { ...item, bullets: (item.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'experience' ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, bullets: (it.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : it)) } : s)),
    }))
  }

  // Education
  const addEducationItem = () => {
    const newEdu = { school: '', degree: '', field: '', startDate: '', endDate: '' }
    setResumeData((prev: any) => ({
      ...prev,
      education: [...(prev.education), newEdu],
      sections: (prev.sections).map((s: any) => (s.type === 'education' ? { ...s, content: [...((s.content as Array<any>)), newEdu] } : s)),
    }))
  }

  const removeEducationItem = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      education: (prev.education).filter((_: any, i: number) => i !== index),
      sections: (prev.sections).map((s: any) => (s.type === 'education' ? { ...s, content: (s.content as Array<any>).filter((_: any, i: number) => i !== index) } : s)),
    }))
  }

  const setEducationField = (index: number, field: string, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      education: (prev.education).map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'education'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) }
        : s)),
    }))
  }

  // Achievements
  const addAchievementItem = () => {
    const newAchievement = { title: '', description: '', date: '' }
    setResumeData((prev: any) => ({
      ...prev,
      achievements: [...(prev.achievements), newAchievement],
      sections: (prev.sections).map((s: any) => (s.type === 'achievements' ? { ...s, content: [...((s.content as Array<any>)), newAchievement] } : s)),
    }))
  }

  const removeAchievementItem = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      achievements: (prev.achievements).filter((_: any, i: number) => i !== index),
      sections: (prev.sections).map((s: any) => (s.type === 'achievements' ? { ...s, content: (s.content as Array<any>).filter((_: any, i: number) => i !== index) } : s)),
    }))
  }

  const setAchievementField = (index: number, field: string, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      achievements: (prev.achievements).map((item: any, i: number) => (i === index ? { ...item, [field]: value } : item)),
      sections: (prev.sections).map((s: any) => (s.type === 'achievements'
        ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) }
        : s)),
    }))
  }

  // Certifications
  const addCertificationItem = () => {
    const newCert = { name: '', issuer: '', date: '', description: '' }
    setResumeData((prev: any) => ({
      ...prev,
      certifications: [...((prev as any).certifications || []), newCert],
      sections: (prev.sections).map((s: any) => (s.type === 'certifications' ? { ...s, content: [...(s.content as Array<any>), newCert] } : s)),
    }))
  }

  const removeCertificationItem = (index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      certifications: ((prev as any).certifications || []).filter((_: any, i: number) => i !== index),
      sections: (prev.sections).map((s: any) => (s.type === 'certifications' ? { ...s, content: (s.content as Array<any>).filter((_: any, i: number) => i !== index) } : s)),
    }))
  }

  const setCertificationField = (index: number, field: string, value: string) => {
    setResumeData((prev: any) => ({
      ...prev,
      certifications: ((prev as any).certifications || []).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)),
      sections: (prev.sections).map((s: any) => (s.type === 'certifications' ? { ...s, content: (s.content as Array<any>).map((it: any, i: number) => (i === index ? { ...it, [field]: value } : it)) } : s)),
    }))
  }

  // Sections
  const addSection = (type: string, title: string) => {
    const newSection = {
      id: type,
      type,
      title,
      order: resumeData.sections.length,
      content: type === 'skills' ? { groups: [{ name: '', skills: [] }] } : [],
    }
    setResumeData((prev: any) => {
      const updated = { ...prev, sections: [...prev.sections, newSection] }
      if (type === 'education' && !prev.education.length) {
        ;(updated as any).education = []
      } else if (type === 'achievements' && !prev.achievements.length) {
        ;(updated as any).achievements = []
      } else if (type === 'skills' && !prev.technologies.length) {
        ;(updated as any).technologies = [{ name: '', skills: [] }]
      }
      return updated
    })
  }

  const suggestBullets = async (index: number) => {
    try {
      if (!resumeData.id) return
      const experienceSection = (resumeData.sections?.find((s: any) => s.type === 'experience') || { content: resumeData.experience })
      const exp = ((experienceSection).content || [])[index]
      const res: any = await aiSuggestBulletsWithRefresh(resumeData.id, getToken, { role: exp?.role || '' })
      const bullets: Array<string> = Array.isArray(res?.bullets)
        ? res.bullets
        : (typeof res?.text === 'string' ? res.text.split('\n').map((s: string) => s.replace(/^[-•\s]+/, '')).filter(Boolean) : [])
      if (!bullets.length) return
      replaceExperienceBullets(index, bullets)
    } catch (e) {
      console.error('Failed to suggest bullets', e)
    }
  }

  const availableSections = [
    { type: 'education', title: 'Education' },
    { type: 'projects', title: 'Projects' },
    { type: 'achievements', title: 'Achievements' },
    { type: 'skills', title: 'Skills' },
    { type: 'leadership', title: 'Leadership' },
    { type: 'certifications', title: 'Certifications' },
  ] as Array<{ type: string; title: string }>

  const jdHints: Array<any> = []

  return {
    resumeData,
    saving,
    hasUnsavedChanges,
    exporting,
    setExporting,
    importing,
    setImporting,
    skillsTags,
    availableSections,
    jdHints,
    summaryRef,
    experienceRef,
    educationRef,
    achievementsRef,
    certificationsRef,
    // top bar handlers
    setName,
    setTemplateId,
    setFontId,
    setThemeId,
    handleSave,
    // editor handlers
    updatePersonalInfo,
    setSkillsFromTags,
    setSummaryText,
    addProjectItem,
    removeProjectItem,
    setProjectField,
    addProjectHighlight,
    removeProjectHighlight,
    setProjectHighlight,
    enhanceSummary,
    setExperienceField,
    setExperienceBullet,
    replaceExperienceBullets,
    enhanceExperienceBullet,
    addExperienceItem,
    removeExperienceItem,
    addExperienceBullet,
    removeExperienceBullet,
    addEducationItem,
    removeEducationItem,
    setEducationField,
    addAchievementItem,
    removeAchievementItem,
    setAchievementField,
    addCertificationItem,
    removeCertificationItem,
    setCertificationField,
    addSection,
    suggestBullets,
  }
}

export type UseResumeStateReturn = ReturnType<typeof useResumeState>


