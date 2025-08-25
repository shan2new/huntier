import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Briefcase, FileText, Save, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthToken } from '@/lib/auth'
import { aiSuggestSummaryWithRefresh, createResumeWithRefresh, exportResumeWithRefresh, getResumeWithRefresh, updateResumeWithRefresh, getProfileWithRefresh, importLinkedInWithRefresh } from '@/lib/api'

export function ResumeBuilder({ resumeId }: { resumeId: string }) {
  const { getToken } = useAuthToken()
  const { user } = useUser()
  const isNew = resumeId === 'new'
  const [saving, setSaving] = useState(false)
  const [, setImporting] = useState(false)
  const [autoImportAttempted, setAutoImportAttempted] = useState(false)
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
      if ((prev.sections as any[]).length > 0) return prev
      const seed = [
        { id: 'summary', type: 'summary', title: 'Summary', order: 0, content: { text: prev.summary || '' } },
        { id: 'experience', type: 'experience', title: 'Experience', order: 1, content: (prev.experience || []) },
        { id: 'achievements', type: 'achievements', title: 'Achievements', order: 2, content: (prev.achievements || []) },
      ]
      return { ...prev, sections: seed }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          sections: Array.isArray(d.sections) ? d.sections : [],
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

  // Attempt auto-import from LinkedIn URL if creating a new resume and profile has url
  useEffect(() => {
    if (autoImportAttempted) return
    if (!isNew) return
    setAutoImportAttempted(true)
    ;(async () => {
      try {
        const profile = await getProfileWithRefresh<any>(getToken)
        const url = (profile as any)?.linkedin_url
        const hasNoExperience = (resumeData.sections || []).every((s: any) => s.type !== 'experience' || (Array.isArray(s.content) && s.content.length === 0))
        if (url && hasNoExperience) {
          await handleImportLinkedIn(url, { silent: true })
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew])

  const handleSave = async () => {
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
        alert('Resume created')
      } else if (resumeData.id) {
        await updateResumeWithRefresh(resumeData.id, payload, getToken)
        alert('Resume saved')
      }
    } catch (e) {
      console.error('Failed to save resume', e)
      alert('Failed to save resume')
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

  

  const getSection = (type: string) => (resumeData.sections as Array<any>).find(s => s.type === type)

  const summarySection = getSection('summary') || { content: { text: resumeData.summary } }
  const experienceSection = getSection('experience') || { content: resumeData.experience }

  const suggestSummary = async () => {
    try {
      if (!resumeData.id) return
      const res = await aiSuggestSummaryWithRefresh(resumeData.id, getToken, { job: '' })
      const text = (res as any)?.summary || ''
      setResumeData(prev => ({
        ...prev,
        summary: text,
        sections: (prev.sections as Array<any>).map((s: any) => s.type === 'summary' ? { ...s, content: { text } } : s),
      }))
    } catch (e) {
      console.error('Failed to suggest summary', e)
    }
  }

  async function handleImportLinkedIn(linkedinUrl?: string | null, opts: { silent?: boolean } = {}) {
    try {
      setImporting(true)
      const profile = linkedinUrl ? { linkedin_url: linkedinUrl } : await getProfileWithRefresh<any>(getToken)
      const url = (profile as any)?.linkedin_url
      if (!url || !String(url).trim()) {
        if (!opts.silent) alert('Add your LinkedIn URL in Profile to import')
        return
      }
      const result = await importLinkedInWithRefresh(getToken, { url })
      const r: any = result || {}
      const importedSections: Array<any> = Array.isArray(r.sections) ? r.sections : []
      const getImported = (type: string) => importedSections.find((s: any) => s.type === type)
      const impExp = getImported('experience')?.content || []
      const impEdu = getImported('education')?.content || r.education || []
      const impSkills = getImported('skills')?.content || r.technologies || null

      setResumeData(prev => {
        let sections = [...(prev.sections as Array<any>)]

        const ensureSection = (type: string, title: string, content: any) => {
          const idx = sections.findIndex(s => s.type === type)
          if (idx >= 0) {
            sections[idx] = { ...sections[idx], content }
          } else {
            sections = [...sections, { id: type, type, title, order: sections.length, content }]
          }
        }

        // Personal info merge (non-empty wins)
        const pi = r.personal_info || {}
        const personal_info = {
          ...prev.personal_info,
          fullName: prev.personal_info.fullName || pi.fullName || '',
          email: prev.personal_info.email || pi.email || '',
          phone: prev.personal_info.phone || pi.phone || '',
          location: prev.personal_info.location || pi.location || '',
        }

        // Summary
        let summary = prev.summary
        if (r.summary && (!prev.summary || prev.summary.trim().length === 0)) {
          summary = r.summary
          sections = sections.map(s => s.type === 'summary' ? { ...s, content: { text: summary } } : s)
        }

        // Experience
        let experience = prev.experience
        if (Array.isArray(impExp) && impExp.length) {
          experience = impExp
          ensureSection('experience', 'Experience', impExp)
        }

        // Education
        let education = prev.education
        if (Array.isArray(impEdu) && impEdu.length) {
          education = impEdu
          ensureSection('education', 'Education', impEdu)
        }

        // Skills/Technologies
        let technologies = prev.technologies
        if (impSkills && ((impSkills.groups && Array.isArray(impSkills.groups)) || Array.isArray(impSkills))) {
          const groups = Array.isArray(impSkills?.groups) ? impSkills.groups : Array.isArray(impSkills) ? impSkills : []
          technologies = groups
          ensureSection('skills', 'Skills', { groups })
        }

        return { ...prev, personal_info, summary, experience, education, technologies, sections }
      })
    } catch (e) {
      console.error('Import LinkedIn failed', e)
      if (!opts.silent) alert('Failed to import from LinkedIn')
    } finally {
      setImporting(false)
    }
  }

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
    <div className="bg-background">
      <div className="border-b bg-card">
        <div className="w-full py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-6 w-6 text-primary" />
              <Input
                value={resumeData.name}
                onChange={(e) => setResumeData(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold bg-transparent border-none focus:ring-1 focus:ring-primary"
                placeholder="Resume Name"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={resumeData.template_id || ''}
                onChange={(e) => setResumeData(prev => ({ ...prev, template_id: e.target.value || null }))}
                className="h-9 rounded-md border px-2 text-sm bg-background"
              >
                <option value="">Default</option>
                <option value="compact">Compact</option>
                <option value="elegant">Elegant</option>
              </select>
              <select
                value={resumeData.theme?.size || 'md'}
                onChange={(e) => setResumeData(prev => ({ ...prev, theme: { ...(prev.theme || {}), size: e.target.value } }))}
                className="h-9 rounded-md border px-2 text-sm bg-background"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
              {/* LinkedIn import removed */}
              <Button onClick={() => download('pdf')} variant="outline">Export PDF</Button>
              <Button onClick={() => download('docx')} variant="outline">Export DOCX</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Tabs defaultValue="personal">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="personal">
                  <User className="h-4 w-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <FileText className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="experience">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Experience
                </TabsTrigger>
                <TabsTrigger value="education">
                  <FileText className="h-4 w-4 mr-2" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="skills">
                  <FileText className="h-4 w-4 mr-2" />
                  Skills
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={resumeData.personal_info.fullName}
                        onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personal_info.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personal_info.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personal_info.location}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Professional Summary</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={suggestSummary}>AI Suggest</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="summary">Summary</Label>
                      <Textarea
                        id="summary"
                        value={(summarySection as any).content?.text || resumeData.summary}
                        onChange={(e) => setResumeData(prev => ({
                          ...prev,
                          summary: e.target.value,
                          sections: (prev.sections as any[]).map((s: any) => s.type === 'summary' ? { ...s, content: { text: e.target.value } } : s),
                        }))}
                        placeholder="Experienced software engineer with 5+ years of expertise in full-stack development..."
                        className="min-h-[150px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Work Experience</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const newExp = {
                          company: '',
                          role: '',
                          startDate: '',
                          endDate: '',
                          bullets: ['']
                        }
                        setResumeData(prev => ({
                          ...prev,
                          experience: [...(prev.experience || []), newExp],
                          sections: (prev.sections as Array<any>).map((s: any) => 
                            s.type === 'experience' 
                              ? { ...s, content: [...((s.content as Array<any>) || []), newExp] }
                              : s
                          ),
                        }))
                      }}
                    >
                      Add Experience
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {((experienceSection as any).content || []).map((exp: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                              value={exp.company || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  experience: (prev.experience as Array<any>).map((item, i) => 
                                    i === index ? { ...item, company: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'experience' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, company: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Company Name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                              value={exp.role || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  experience: (prev.experience as Array<any>).map((item, i) => 
                                    i === index ? { ...item, role: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'experience' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, role: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Software Engineer"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              value={exp.startDate || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  experience: (prev.experience as Array<any>).map((item, i) => 
                                    i === index ? { ...item, startDate: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'experience' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, startDate: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Jan 2022"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                              value={exp.endDate || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  experience: (prev.experience as Array<any>).map((item, i) => 
                                    i === index ? { ...item, endDate: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'experience' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, endDate: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Present"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Key Accomplishments</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResumeData(prev => ({
                                  ...prev,
                                  experience: (prev.experience as Array<any>).map((item, i) => 
                                    i === index ? { ...item, bullets: [...(item.bullets || []), ''] } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'experience' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, bullets: [...(item.bullets || []), ''] } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                            >
                              + Add Bullet
                            </Button>
                          </div>
                          
                          {(exp.bullets || ['']).map((bullet: string, bulletIndex: number) => (
                            <div key={bulletIndex} className="flex gap-2">
                              <div className="flex-1">
                                <Textarea
                                  value={bullet}
                                  onChange={(e) => {
                                    const newValue = e.target.value
                                    setResumeData(prev => ({
                                      ...prev,
                                      experience: (prev.experience as Array<any>).map((item, i) => 
                                        i === index 
                                          ? { 
                                              ...item, 
                                              bullets: (item.bullets as Array<string>).map((b, bi) => 
                                                bi === bulletIndex ? newValue : b
                                              ) 
                                            } 
                                          : item
                                      ),
                                      sections: (prev.sections as Array<any>).map((s: any) => 
                                        s.type === 'experience' 
                                          ? { 
                                              ...s, 
                                              content: (s.content as Array<any>).map((item, i) => 
                                                i === index 
                                                  ? { 
                                                      ...item, 
                                                      bullets: (item.bullets as Array<string>).map((b, bi) => 
                                                        bi === bulletIndex ? newValue : b
                                                      ) 
                                                    } 
                                                  : item
                                              ) 
                                            }
                                          : s
                                      ),
                                    }))
                                  }}
                                  placeholder="• Achieved 25% increase in user engagement by implementing new features"
                                  className="min-h-[60px]"
                                />
                              </div>
                              {(exp.bullets || []).length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setResumeData(prev => ({
                                      ...prev,
                                      experience: (prev.experience as Array<any>).map((item, i) => 
                                        i === index 
                                          ? { 
                                              ...item, 
                                              bullets: (item.bullets as Array<string>).filter((_, bi) => bi !== bulletIndex)
                                            } 
                                          : item
                                      ),
                                      sections: (prev.sections as Array<any>).map((s: any) => 
                                        s.type === 'experience' 
                                          ? { 
                                              ...s, 
                                              content: (s.content as Array<any>).map((item, i) => 
                                                i === index 
                                                  ? { 
                                                      ...item, 
                                                      bullets: (item.bullets as Array<string>).filter((_, bi) => bi !== bulletIndex)
                                                    } 
                                                  : item
                                              ) 
                                            }
                                          : s
                                      ),
                                    }))
                                  }}
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResumeData(prev => ({
                                ...prev,
                                experience: (prev.experience as Array<any>).filter((_, i) => i !== index),
                                sections: (prev.sections as Array<any>).map((s: any) => 
                                  s.type === 'experience' 
                                    ? { ...s, content: (s.content as Array<any>).filter((_, i) => i !== index) }
                                    : s
                                ),
                              }))
                            }}
                          >
                            Remove Experience
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {((experienceSection as any).content || []).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No work experience added yet.</p>
                        <p className="text-sm mt-2">Click "Add Experience" to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="education" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Education</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const newEdu = {
                          institution: '',
                          degree: '',
                          field: '',
                          graduationYear: '',
                          gpa: ''
                        }
                        setResumeData(prev => ({
                          ...prev,
                          education: [...(prev.education || []), newEdu],
                          sections: (prev.sections as Array<any>).some(s => s.type === 'education')
                            ? (prev.sections as Array<any>).map((s: any) => 
                                s.type === 'education' 
                                  ? { ...s, content: [...((s.content as Array<any>) || []), newEdu] }
                                  : s
                              )
                            : [...(prev.sections as Array<any>), { id: 'education', type: 'education', title: 'Education', order: prev.sections.length, content: [newEdu] }],
                        }))
                      }}
                    >
                      Add Education
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {((getSection('education')?.content || []) as Array<any>).map((edu: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  education: (prev.education as Array<any>).map((item, i) => 
                                    i === index ? { ...item, institution: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'education' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, institution: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Stanford University"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Degree</Label>
                            <Input
                              value={edu.degree || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  education: (prev.education as Array<any>).map((item, i) => 
                                    i === index ? { ...item, degree: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'education' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, degree: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Bachelor of Technology"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Field of Study</Label>
                            <Input
                              value={edu.field || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  education: (prev.education as Array<any>).map((item, i) => 
                                    i === index ? { ...item, field: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'education' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, field: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="Computer Science"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Graduation Year</Label>
                            <Input
                              value={edu.graduationYear || ''}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setResumeData(prev => ({
                                  ...prev,
                                  education: (prev.education as Array<any>).map((item, i) => 
                                    i === index ? { ...item, graduationYear: newValue } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'education' 
                                      ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                          i === index ? { ...item, graduationYear: newValue } : item
                                        ) }
                                      : s
                                  ),
                                }))
                              }}
                              placeholder="2024"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setResumeData(prev => ({
                                ...prev,
                                education: (prev.education as Array<any>).map((item, i) => 
                                  i === index ? { ...item, gpa: newValue } : item
                                ),
                                sections: (prev.sections as Array<any>).map((s: any) => 
                                  s.type === 'education' 
                                    ? { ...s, content: (s.content as Array<any>).map((item, i) => 
                                        i === index ? { ...item, gpa: newValue } : item
                                      ) }
                                    : s
                                ),
                              }))
                            }}
                            placeholder="3.8/4.0"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResumeData(prev => ({
                                ...prev,
                                education: (prev.education as Array<any>).filter((_, i) => i !== index),
                                sections: (prev.sections as Array<any>).map((s: any) => 
                                  s.type === 'education' 
                                    ? { ...s, content: (s.content as Array<any>).filter((_, i) => i !== index) }
                                    : s
                                ),
                              }))
                            }}
                          >
                            Remove Education
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {((getSection('education')?.content || []) as Array<any>).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No education added yet.</p>
                        <p className="text-sm mt-2">Click "Add Education" to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>


              <TabsContent value="skills" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Skills</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const newSkillGroup = {
                          name: '',
                          skills: ['']
                        }
                        setResumeData(prev => ({
                          ...prev,
                          technologies: [...(prev.technologies || []), newSkillGroup],
                          sections: (prev.sections as Array<any>).some(s => s.type === 'skills')
                            ? (prev.sections as Array<any>).map((s: any) => 
                                s.type === 'skills' 
                                  ? { ...s, content: { groups: [...((s.content?.groups as Array<any>) || []), newSkillGroup] } }
                                  : s
                              )
                            : [...(prev.sections as Array<any>), { id: 'skills', type: 'skills', title: 'Skills', order: prev.sections.length, content: { groups: [newSkillGroup] } }],
                        }))
                      }}
                    >
                      Add Skill Category
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {((getSection('skills')?.content?.groups || []) as Array<any>).map((skillGroup: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Category Name</Label>
                          <Input
                            value={skillGroup.name || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setResumeData(prev => ({
                                ...prev,
                                technologies: (prev.technologies as Array<any>).map((item, i) => 
                                  i === index ? { ...item, name: newValue } : item
                                ),
                                sections: (prev.sections as Array<any>).map((s: any) => 
                                  s.type === 'skills' 
                                    ? { 
                                        ...s, 
                                        content: { 
                                          groups: (s.content?.groups as Array<any>).map((item, i) => 
                                            i === index ? { ...item, name: newValue } : item
                                          ) 
                                        } 
                                      }
                                    : s
                                ),
                              }))
                            }}
                            placeholder="Programming Languages"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Skills</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setResumeData(prev => ({
                                  ...prev,
                                  technologies: (prev.technologies as Array<any>).map((item, i) => 
                                    i === index ? { ...item, skills: [...(item.skills || []), ''] } : item
                                  ),
                                  sections: (prev.sections as Array<any>).map((s: any) => 
                                    s.type === 'skills' 
                                      ? { 
                                          ...s, 
                                          content: { 
                                            groups: (s.content?.groups as Array<any>).map((item, i) => 
                                              i === index ? { ...item, skills: [...(item.skills || []), ''] } : item
                                            ) 
                                          } 
                                        }
                                      : s
                                  ),
                                }))
                              }}
                            >
                              + Add Skill
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {(skillGroup.skills || ['']).map((skill: string, skillIndex: number) => (
                              <div key={skillIndex} className="flex gap-2">
                                <Input
                                  value={skill}
                                  onChange={(e) => {
                                    const newValue = e.target.value
                                    setResumeData(prev => ({
                                      ...prev,
                                      technologies: (prev.technologies as Array<any>).map((item, i) => 
                                        i === index 
                                          ? { 
                                              ...item, 
                                              skills: (item.skills as Array<string>).map((s, si) => 
                                                si === skillIndex ? newValue : s
                                              ) 
                                            } 
                                          : item
                                      ),
                                      sections: (prev.sections as Array<any>).map((s: any) => 
                                        s.type === 'skills' 
                                          ? { 
                                              ...s, 
                                              content: { 
                                                groups: (s.content?.groups as Array<any>).map((item, i) => 
                                                  i === index 
                                                    ? { 
                                                        ...item, 
                                                        skills: (item.skills as Array<string>).map((s, si) => 
                                                          si === skillIndex ? newValue : s
                                                        ) 
                                                      } 
                                                    : item
                                                ) 
                                              } 
                                            }
                                          : s
                                      ),
                                    }))
                                  }}
                                  placeholder="JavaScript"
                                />
                                {(skillGroup.skills || []).length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setResumeData(prev => ({
                                        ...prev,
                                        technologies: (prev.technologies as Array<any>).map((item, i) => 
                                          i === index 
                                            ? { 
                                                ...item, 
                                                skills: (item.skills as Array<string>).filter((_, si) => si !== skillIndex)
                                              } 
                                            : item
                                        ),
                                        sections: (prev.sections as Array<any>).map((s: any) => 
                                          s.type === 'skills' 
                                            ? { 
                                                ...s, 
                                                content: { 
                                                  groups: (s.content?.groups as Array<any>).map((item, i) => 
                                                    i === index 
                                                      ? { 
                                                          ...item, 
                                                          skills: (item.skills as Array<string>).filter((_, si) => si !== skillIndex)
                                                        } 
                                                      : item
                                                  ) 
                                                } 
                                              }
                                            : s
                                        ),
                                      }))
                                    }}
                                  >
                                    ×
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResumeData(prev => ({
                                ...prev,
                                technologies: (prev.technologies as Array<any>).filter((_, i) => i !== index),
                                sections: (prev.sections as Array<any>).map((s: any) => 
                                  s.type === 'skills' 
                                    ? { 
                                        ...s, 
                                        content: { 
                                          groups: (s.content?.groups as Array<any>).filter((_, i) => i !== index) 
                                        } 
                                      }
                                    : s
                                ),
                              }))
                            }}
                          >
                            Remove Category
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {((getSection('skills')?.content?.groups || []) as Array<any>).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No skill categories added yet.</p>
                        <p className="text-sm mt-2">Click "Add Skill Category" to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">
                      {resumeData.personal_info.fullName || 'Your Name'}
                    </h1>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      {resumeData.personal_info.email && <div>{resumeData.personal_info.email}</div>}
                      {resumeData.personal_info.phone && <div>{resumeData.personal_info.phone}</div>}
                      {resumeData.personal_info.location && <div>{resumeData.personal_info.location}</div>}
                    </div>
                  </div>

                  {(summarySection as any).content?.text && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Professional Summary</h2>
                      <p className="text-sm text-gray-700">{(summarySection as any).content.text}</p>
                    </div>
                  )}

                  {Array.isArray((experienceSection as any).content) && (experienceSection as any).content.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Work Experience</h2>
                      <div className="space-y-4">
                        {(experienceSection as any).content.map((exp: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {exp.company && exp.role && (
                              <div className="font-medium">
                                {exp.role} at {exp.company}
                              </div>
                            )}
                            {(exp.startDate || exp.endDate) && (
                              <div className="text-gray-600 text-xs">
                                {exp.startDate} {exp.endDate && `- ${exp.endDate}`}
                              </div>
                            )}
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                {exp.bullets.filter((bullet: string) => bullet.trim()).map((bullet: string, bulletIdx: number) => (
                                  <li key={bulletIdx} className="text-gray-700">{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((getSection('education')?.content || []) as Array<any>).length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Education</h2>
                      <div className="space-y-2">
                        {((getSection('education')?.content || []) as Array<any>).map((edu: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium">
                              {edu.degree && edu.field ? `${edu.degree} in ${edu.field}` : edu.degree || edu.field}
                            </div>
                            {edu.institution && (
                              <div className="text-gray-600">
                                {edu.institution} {edu.graduationYear && `• ${edu.graduationYear}`} {edu.gpa && `• GPA: ${edu.gpa}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((getSection('skills')?.content?.groups || []) as Array<any>).length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Skills</h2>
                      <div className="space-y-2">
                        {((getSection('skills')?.content?.groups || []) as Array<any>).map((group: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {group.name && (
                              <span className="font-medium">{group.name}: </span>
                            )}
                            {group.skills && group.skills.filter((skill: string) => skill.trim()).length > 0 && (
                              <span className="text-gray-700">
                                {group.skills.filter((skill: string) => skill.trim()).join(', ')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
