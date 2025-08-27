import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { toast } from '@/components/ui/toaster'

import { useAuthToken } from '@/lib/auth'
import { aiGenerateResumeFromProfileWithRefresh, aiSuggestBulletsWithRefresh, createResumeWithRefresh, exportResumeWithRefresh, getProfileWithRefresh, getResumeWithRefresh, updateResumeWithRefresh } from '@/lib/api'
import { ResumeToolbar } from '@/components/resume/ResumeToolbar'
import { PersonalInfoSection } from '@/components/resume/PersonalInfoSection'
import { SummarySection } from '@/components/resume/SummarySection'
import { ExperienceSection } from '@/components/resume/ExperienceSection'
import { SkillsSection } from '@/components/resume/SkillsSection'
import { EducationSection } from '@/components/resume/EducationSection'
import { AchievementsSection } from '@/components/resume/AchievementsSection'
import { ResumeProgress } from '@/components/resume/ResumeProgress'
import { SectionsSidebar } from '@/components/resume/SectionsSidebar'
import { SectionManager } from '@/components/resume/SectionManager'
import '@/components/resume/resume-editor.css'

export function ResumeBuilder({ resumeId }: { resumeId: string }) {
  const { getToken } = useAuthToken()
  const { user } = useUser()
  const isNew = resumeId === 'new'
  const [saving, setSaving] = useState(false)
  // Removed LinkedIn import; importing state no longer used
  const [autoImportAttempted, setAutoImportAttempted] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [resumeData, setResumeData] = useState({
    id: undefined as string | undefined,
    name: isNew ? 'Untitled Resume' : 'My Resume',
    personal_info: {
      fullName: '',
      email: '',
      phone: '',
      location: ''
    },
    summary: '',
    experience: [] as Array<any>,
    achievements: [] as Array<any>,
    leadership: [] as Array<any>,
    education: [] as Array<any>,
    technologies: [] as Array<any>,
    sections: [] as Array<any>,
    template_id: null as string | null,
    theme: { font: 'Inter', size: 'md', accent: 'zinc' } as any,
  })

  useEffect(() => {
    setResumeData(prev => {
      if ((prev.sections).length > 0) return prev
      const seed = []
      let order = 0
      
      // Add summary section
      seed.push({ id: 'summary', type: 'summary', title: 'Summary', order: order++, content: { text: prev.summary || '' } })
      
      // Add experience section if there's experience data
      if (prev.experience.length > 0) {
        seed.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: prev.experience })
      }
      
      // Add education section if there's education data
      if (prev.education.length > 0) {
        seed.push({ id: 'education', type: 'education', title: 'Education', order: order++, content: prev.education })
      }
      
      // Add skills section if there are skills
      if (prev.technologies.length > 0 && prev.technologies[0].skills?.length > 0) {
        seed.push({ id: 'skills', type: 'skills', title: 'Skills', order: order++, content: { groups: prev.technologies } })
      }
      
      // Add achievements section if there are achievements
      if (prev.achievements.length > 0) {
        seed.push({ id: 'achievements', type: 'achievements', title: 'Achievements', order: order++, content: prev.achievements })
      }
      
      // Default sections if empty
      if (seed.length === 1) {
        seed.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: [] })
      }
      
      return { ...prev, sections: seed }
    })
  }, [])
  // Ensure sections array always contains a summary section at the top
  const ensureSectionsWithSummary = (sections: Array<any>, summaryText: string) => {
    const withoutSummary = (Array.isArray(sections) ? sections : []).filter((s: any) => s.type !== 'summary')
    const ordered = withoutSummary.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    const final = [
      { id: 'summary', type: 'summary', title: 'Summary', order: 0, content: { text: summaryText || '' } },
      ...ordered.map((s: any, idx: number) => ({ ...s, order: idx + 1 }))
    ]
    return final
  }


  useEffect(() => {
    if (isNew) return
    ;(async () => {
      try {
        const data = await getResumeWithRefresh(resumeId, getToken)
        const d: any = data || {}
        const buildSectionsFromData = (src: any) => {
          const sections: Array<any> = []
          let order = 0
          // Always include summary section (even if empty, for guidance)
          sections.push({ id: 'summary', type: 'summary', title: 'Summary', order: order++, content: { text: src.summary || '' } })
          // Experience
          if (Array.isArray(src.experience) && src.experience.length > 0) {
            sections.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: src.experience })
          }
          // Education
          if (Array.isArray(src.education) && src.education.length > 0) {
            sections.push({ id: 'education', type: 'education', title: 'Education', order: order++, content: src.education })
          }
          // Skills
          if (Array.isArray(src.technologies) && src.technologies.length > 0) {
            sections.push({ id: 'skills', type: 'skills', title: 'Skills', order: order++, content: { groups: src.technologies } })
          }
          // Achievements
          if (Array.isArray(src.achievements) && src.achievements.length > 0) {
            sections.push({ id: 'achievements', type: 'achievements', title: 'Achievements', order: order++, content: src.achievements })
          }
          if (sections.length === 1) {
            sections.push({ id: 'experience', type: 'experience', title: 'Work Experience', order: order++, content: [] })
          }
          return sections
        }
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
          sections: (Array.isArray(d.sections) && d.sections.length > 0) ? d.sections : buildSectionsFromData(d),
          template_id: d.template_id || null,
          theme: d.theme || { font: 'Inter', size: 'md', accent: 'zinc' },
        })
      } catch (e) {
        console.error('Failed to load resume', e)
      } finally {
      }
    })()
  }, [resumeId, getToken, isNew])

  // Prefill personal info from Clerk user (name, email)
  useEffect(() => {
    if (!user) return
    setResumeData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        fullName: prev.personal_info.fullName || (user.fullName || ''),
        email: prev.personal_info.email || (user.primaryEmailAddress?.emailAddress || ''),
      }
    }))
  }, [user])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !resumeData.id) return
    
    const timer = setTimeout(() => {
      handleSave(false) // Silent save
    }, 2000) // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(timer)
  }, [resumeData, hasUnsavedChanges])

  // Mark as having unsaved changes when data changes
  useEffect(() => {
    if (resumeData.id) {
      setHasUnsavedChanges(true)
    }
  }, [resumeData])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcut: Ctrl/Cmd + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [resumeData])

  // Attempt to seed from profile using AI when creating a new resume
  useEffect(() => {
    if (autoImportAttempted) return
    if (!isNew) return
    setAutoImportAttempted(true)
    ;(async () => {
      try {
        const profile = await getProfileWithRefresh<any>(getToken)
        const aiSeed: any = await aiGenerateResumeFromProfileWithRefresh(getToken, profile)
        if (aiSeed && typeof aiSeed === 'object') {
          setResumeData(prev => {
            const nextSummary = (typeof aiSeed.summary === 'string' && aiSeed.summary) ? aiSeed.summary : prev.summary
            const aiSections = Array.isArray(aiSeed?.sections) && aiSeed.sections.length ? aiSeed.sections : prev.sections
            const sectionsWithSummary = ensureSectionsWithSummary(aiSections, nextSummary)
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
  }, [isNew])

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
        template_id: resumeData.template_id,
        theme: resumeData.theme,
      }

      if (isNew) {
        const created = await createResumeWithRefresh(payload, getToken)
        setResumeData((prev) => ({ ...prev, id: (created as any).id }))
        window.history.replaceState({}, '', `/resumes/${(created as any).id}`)
      } else if (resumeData.id) {
        await updateResumeWithRefresh(resumeData.id, payload, getToken)
      }
      
      setLastSaved(new Date())
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

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }))
  }

  

  const getSection = (type: string) => (resumeData.sections).find(s => s.type === type)

  const skillsTags = (() => {
    const groups = (getSection('skills')?.content?.groups || []) as Array<any>
    if (Array.isArray(groups) && groups.length > 0) {
      const all = groups.flatMap((g: any) => Array.isArray(g.skills) ? g.skills : [])
      return Array.from(new Set(all.map((s: string) => String(s).trim()).filter(Boolean)))
    }
    const tech = Array.isArray(resumeData.technologies) ? resumeData.technologies : []
    const all = tech.flatMap((g: any) => Array.isArray(g?.skills) ? g.skills : [])
    return Array.from(new Set(all.map((s: string) => String(s).trim()).filter(Boolean)))
  })()

  // Available sections that can be added
  const availableSections = [
    { 
      type: 'education', 
      title: 'Education',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    },
    { 
      type: 'achievements', 
      title: 'Achievements',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    },
    { 
      type: 'skills', 
      title: 'Skills',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    },
    { 
      type: 'leadership', 
      title: 'Leadership',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    }
  ]

  const setSkillsFromTags = (tags: Array<string>) => {
    const unique = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
    setResumeData((prev) => ({
      ...prev,
      technologies: [{ name: '', skills: unique }],
      sections: (prev.sections).some((s: any) => s.type === 'skills')
        ? (prev.sections).map((s: any) => s.type === 'skills' ? { ...s, content: { groups: [{ name: '', skills: unique }] } } : s)
        : [...(prev.sections), { id: 'skills', type: 'skills', title: 'Skills', order: (prev.sections).length, content: { groups: [{ name: '', skills: unique }] } }],
    }))
  }
  // Skills helpers removed; will reintroduce when skills UI is added back

  // InlineEditable moved to `components/resume/InlineEditable`

  // Helpers to sync edits from preview with sections
  const setSummaryText = (text: string) => {
    setResumeData(prev => ({
      ...prev,
      summary: text,
      sections: (prev.sections).map((s: any) => s.type === 'summary' ? { ...s, content: { text } } : s),
    }))
  }

  const setExperienceField = (index: number, field: 'company' | 'role' | 'startDate' | 'endDate', value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience).map((item, i) => i === index ? { ...item, [field]: value } : item),
      sections: (prev.sections).map((s: any) => s.type === 'experience'
        ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, [field]: value } : it) }
        : s
      ),
    }))
  }

  const setExperienceBullet = (index: number, bulletIndex: number, text: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience).map((item, i) => i === index ? { ...item, bullets: (item.bullets || []).map((b: string, bi: number) => bi === bulletIndex ? text : b) } : item),
      sections: (prev.sections).map((s: any) => s.type === 'experience'
        ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, bullets: (it.bullets || []).map((b: string, bi: number) => bi === bulletIndex ? text : b) } : it) }
        : s
      ),
    }))
  }

  const addExperienceItem = () => {
    const newExp = { company: '', role: '', startDate: '', endDate: '', bullets: [''] }
    setResumeData(prev => ({
      ...prev,
      experience: [...(prev.experience), newExp],
      sections: (prev.sections).map((s: any) => s.type === 'experience' ? { ...s, content: [...((s.content as Array<any>)), newExp] } : s),
    }))
  }

  const removeExperienceItem = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience).filter((_, i) => i !== index),
      sections: (prev.sections).map((s: any) => s.type === 'experience' ? { ...s, content: (s.content as Array<any>).filter((_, i) => i !== index) } : s),
    }))
  }

  const addExperienceBullet = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience).map((item, i) => i === index ? { ...item, bullets: [...(item.bullets || []), ''] } : item),
      sections: (prev.sections).map((s: any) => s.type === 'experience' ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, bullets: [...(it.bullets || []), ''] } : it) } : s),
    }))
  }

  const removeExperienceBullet = (index: number, bulletIndex: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: (prev.experience).map((item, i) => i === index ? { ...item, bullets: (item.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : item),
      sections: (prev.sections).map((s: any) => s.type === 'experience' ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, bullets: (it.bullets || []).filter((_: string, bi: number) => bi !== bulletIndex) } : it) } : s),
    }))
  }

  // Education section handlers
  const addEducationItem = () => {
    const newEdu = { school: '', degree: '', field: '', startDate: '', endDate: '' }
    setResumeData(prev => ({
      ...prev,
      education: [...(prev.education), newEdu],
      sections: (prev.sections).map((s: any) => s.type === 'education' ? { ...s, content: [...((s.content as Array<any>)), newEdu] } : s),
    }))
  }

  const removeEducationItem = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: (prev.education).filter((_, i) => i !== index),
      sections: (prev.sections).map((s: any) => s.type === 'education' ? { ...s, content: (s.content as Array<any>).filter((_, i) => i !== index) } : s),
    }))
  }

  const setEducationField = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: (prev.education).map((item, i) => i === index ? { ...item, [field]: value } : item),
      sections: (prev.sections).map((s: any) => s.type === 'education'
        ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, [field]: value } : it) }
        : s
      ),
    }))
  }

  // Achievements section handlers
  const addAchievementItem = () => {
    const newAchievement = { title: '', description: '', date: '' }
    setResumeData(prev => ({
      ...prev,
      achievements: [...(prev.achievements), newAchievement],
      sections: (prev.sections).map((s: any) => s.type === 'achievements' ? { ...s, content: [...((s.content as Array<any>)), newAchievement] } : s),
    }))
  }

  const removeAchievementItem = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      achievements: (prev.achievements).filter((_, i) => i !== index),
      sections: (prev.sections).map((s: any) => s.type === 'achievements' ? { ...s, content: (s.content as Array<any>).filter((_, i) => i !== index) } : s),
    }))
  }

  const setAchievementField = (index: number, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      achievements: (prev.achievements).map((item, i) => i === index ? { ...item, [field]: value } : item),
      sections: (prev.sections).map((s: any) => s.type === 'achievements'
        ? { ...s, content: (s.content as Array<any>).map((it, i) => i === index ? { ...it, [field]: value } : it) }
        : s
      ),
    }))
  }

  // Add new section
  const addSection = (type: string, title: string) => {
    const newSection = {
      id: type,
      type,
      title,
      order: resumeData.sections.length,
      content: type === 'skills' ? { groups: [{ name: '', skills: [] }] } : []
    }
    setResumeData(prev => {
      const updated = { ...prev, sections: [...prev.sections, newSection] }
      
      // Initialize the corresponding data array if needed
      if (type === 'education' && !prev.education.length) {
        updated.education = []
      } else if (type === 'achievements' && !prev.achievements.length) {
        updated.achievements = []
      } else if (type === 'skills' && !prev.technologies.length) {
        updated.technologies = [{ name: '', skills: [] }]
      }
      
      return updated
    })
  }

  // Remove a section from the resume (keeps underlying data for undoability)
  const removeSection = (type: string) => {
    setResumeData(prev => {
      const filtered = (prev.sections).filter((s: any) => s.type !== type)
      const reindexed = filtered.map((s: any, i: number) => ({ ...s, order: i }))
      return { ...prev, sections: reindexed }
    })
  }

  // Reorder sections based on indices within the sorted list
  const reorderSections = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    setResumeData(prev => {
      const ordered = [...(prev.sections)].sort((a, b) => a.order - b.order)
      const [moved] = ordered.splice(fromIndex, 1)
      ordered.splice(toIndex, 0, moved)
      const withOrder = ordered.map((s, i) => ({ ...s, order: i }))
      return { ...prev, sections: withOrder }
    })
  }

  // Summary AI suggestion temporarily disabled in UI

  const suggestBullets = async (index: number) => {
    try {
      if (!resumeData.id) return
      const experienceSection = getSection('experience') || { content: resumeData.experience }
      const exp = ((experienceSection).content || [])[index]
      const res: any = await aiSuggestBulletsWithRefresh(resumeData.id, getToken, { role: exp?.role || '' })
      const bullets: Array<string> = Array.isArray(res?.bullets)
        ? res.bullets
        : (typeof res?.text === 'string' ? res.text.split('\n').map((s: string) => s.replace(/^[-•\s]+/, '')).filter(Boolean) : [])
      if (!bullets.length) return
      setResumeData(prev => ({
        ...prev,
        experience: (prev.experience).map((item, i) => i === index ? { ...item, bullets } : item),
        sections: (prev.sections).map((s: any) =>
          s.type === 'experience'
            ? { ...s, content: (s.content as Array<any>).map((item, i) => i === index ? { ...item, bullets } : item) }
            : s
        ),
      }))
    } catch (e) {
      console.error('Failed to suggest bullets', e)
    }
  }

  // ATS checker removed from this view for now

  // Section reordering helpers removed from this simplified builder

  // (Removed) LinkedIn import helper and any automatic LinkedIn imports

  const download = async (format: 'pdf' | 'docx') => {
    try {
      if (!resumeData.id) return
      await exportResumeWithRefresh(resumeData.id, async () => {
        const token = await getToken()
        return token
      })
      // If API is set to return blob via fetch, we need direct fetch in api lib; fallback below silently
    } catch {}
    try {
      const token = await getToken()
      const url = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api'}/v1/resumes/${resumeData.id}/export?format=${format}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const buf = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(buf)
      a.download = `resume.${format}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      console.error('Failed to download', e)
    }
  }

  return (
    <div>

      {/* Document Viewer Background */}
      <div className="document-viewer">
        <div className="mx-auto px-8 py-8" style={{ maxWidth: '1200px' }}>
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,794px)_1fr]">
            {/* Left Sidebar - Toolbar + Progress & Sections */}
            <div className="hidden lg:block w-80 space-y-4 justify-self-start">
              {/* Toolbar moved into sidebar */}
              <ResumeToolbar
                name={resumeData.name}
                onNameChange={(name) => setResumeData(prev => ({ ...prev, name }))}
                templateId={resumeData.template_id}
                onTemplateChange={(template_id) => setResumeData(prev => ({ ...prev, template_id }))}
                onExportPdf={() => download('pdf')}
                onExportDocx={() => download('docx')}
                onSave={handleSave}
                saving={saving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
                variant="card"
              />
              <div className="slide-in-left" style={{ animationDelay: '100ms' }}>
                <ResumeProgress
                  personalInfo={resumeData.personal_info}
                  summary={resumeData.summary}
                  experience={resumeData.experience}
                  skills={skillsTags}
                />
              </div>
              
              {/* Sections Sidebar */}
              <SectionsSidebar
                sections={resumeData.sections}
                availableSections={availableSections}
                onAddSection={addSection}
                onRemoveSection={removeSection}
                onReorder={reorderSections}
                onScrollTo={(type) => {
                  const el = document.querySelector(`[data-section="${type}"]`)
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            </div>

            {/* Resume Document - Single Continuous Page */}
            <div className="lg:col-start-2 justify-self-center">
              <div className="w-full max-w-[900px]">
                <div className="relative mb-8 last:mb-0">
                  <div 
                    className="resume-document mx-auto"
                    style={{ 
                      colorScheme: 'light'
                    }}
                  >
                    <div className="px-16 py-16 space-y-8 resume-content">
                      <div data-section="personal-info">
                        <PersonalInfoSection personalInfo={resumeData.personal_info} onChange={(field, value) => updatePersonalInfo(field, value)} />
                      </div>

                      {(!resumeData.personal_info.fullName && !resumeData.summary && resumeData.sections.length <= 1) && (
                        <div className="text-center py-16">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Let's build your resume</h3>
                          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                            Start by clicking on any section below to add your information.
                          </p>
                        </div>
                      )}

                      {([...resumeData.sections].sort((a, b) => a.order - b.order)).map((section) => {
                        switch (section.type) {
                          case 'summary':
                            return (
                              <div key={section.id} data-section="summary">
                                <SummarySection text={section.content?.text || ''} onChange={setSummaryText} />
                              </div>
                            )
                          case 'experience': {
                            const expItems = section.content || []
                            return (
                              <div key={section.id} data-section="experience">
                                <ExperienceSection
                                  items={expItems}
                                  onAddItem={addExperienceItem}
                                  onRemoveItem={removeExperienceItem}
                                  onChangeField={setExperienceField}
                                  onAddBullet={addExperienceBullet}
                                  onRemoveBullet={removeExperienceBullet}
                                  onChangeBullet={setExperienceBullet}
                                  onSuggestBullets={suggestBullets}
                                />
                              </div>
                            )
                          }
                          case 'education': {
                            const eduItems = section.content || []
                            return (
                              <div key={section.id} data-section="education">
                                <EducationSection
                                  items={eduItems}
                                  onAddItem={addEducationItem}
                                  onRemoveItem={removeEducationItem}
                                  onChangeField={(idx, field, value) => setEducationField(idx, field as any, value)}
                                />
                              </div>
                            )
                          }
                          case 'achievements': {
                            const achItems = section.content || []
                            return (
                              <div key={section.id} data-section="achievements">
                                <AchievementsSection
                                  items={achItems}
                                  onAddItem={addAchievementItem}
                                  onRemoveItem={removeAchievementItem}
                                  onChangeField={(idx, field, value) => setAchievementField(idx, field as any, value)}
                                />
                              </div>
                            )
                          }
                          case 'skills':
                            return (
                              <div key={section.id} data-section="skills">
                                <SkillsSection
                                  tags={skillsTags}
                                  onChange={setSkillsFromTags}
                                />
                              </div>
                            )
                          default:
                            return null
                        }
                      })}

                      <SectionManager
                        key="final-manager"
                        sections={resumeData.sections}
                        onAddSection={addSection}
                        availableSections={availableSections}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
