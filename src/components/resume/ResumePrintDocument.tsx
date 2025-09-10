import { getResumeTheme } from '@/lib/themes'
import { getResumeFont } from '@/lib/fonts'
import { getResumeTemplate } from '@/lib/templates'
import { SidebarBand } from '@/components/resume/SidebarBand'

type ResumePrintDocumentProps = {
  data: {
    name?: string
    personal_info?: { fullName?: string; email?: string; phone?: string; location?: string; linkedin?: string }
    sections?: Array<any>
  }
}

export function ResumePrintDocument({ data }: ResumePrintDocumentProps) {
  const pi = data.personal_info || {}
  const sections = Array.isArray(data.sections) ? [...data.sections].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)) : []

  const getSection = (type: string) => sections.find((s: any) => s?.type === type)
  const summaryText = getSection('summary')?.content?.text || ''
  const experienceItems: Array<any> = getSection('experience')?.content || []
  const educationItems: Array<any> = getSection('education')?.content || []
  const achievementsItems: Array<any> = getSection('achievements')?.content || []
  const certificationsItems: Array<any> = getSection('certifications')?.content || []
  const skillsContent: any = getSection('skills')?.content || { groups: [] }
  const projectsItems: Array<any> = getSection('projects')?.content || []

  const theme = getResumeTheme((data as any)?.theme?.id || 'minimal')
  const chosen = getResumeFont(((data as any)?.theme?.font) || null)
  const style = { colorScheme: 'light' as const, fontFamily: (chosen.stack || theme.fontFamily) }
  // Ensure symmetric horizontal padding for print and screen
  const contentClass = `${theme.contentClass || 'px-16 py-16'} space-y-8 resume-content ${theme.bodyClass}`
  const template = getResumeTemplate((data as any)?.template_id || 'single')

  const SummaryBlock = () => (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-px w-10 ${theme.dividerClass}`} />
          <h2 className={theme.headingClass}>Professional Summary</h2>
          <div className={`h-px flex-1 ${theme.dividerClass}`} />
        </div>
      </div>
      {summaryText && (
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{summaryText}</p>
      )}
    </div>
  )

  const ExperienceBlock = () => (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-px w-10 ${theme.dividerClass}`} />
          <h2 className={theme.headingClass}>Work Experience</h2>
          <div className={`h-px flex-1 ${theme.dividerClass}`} />
        </div>
      </div>
      <div>
        {experienceItems.map((exp: any, idx: number) => (
          <div key={idx} className="group relative pr-5 py-5 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline text-base gap-1">
                  <span className="font-semibold text-gray-900">{exp.role}</span>
                  <span className="text-gray-500">at</span>
                  <span className="font-medium text-gray-800">{exp.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{exp.startDate}</span>
                  <span className="text-gray-400">–</span>
                  <span>{exp.endDate}</span>
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {(Array.isArray(exp.bullets) ? exp.bullets : []).map((b: string, bi: number) => (
                <li key={bi} className="relative flex items-start gap-3">
                  <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <div className="flex-1 pl-5">
                    <div className="text-sm leading-relaxed text-gray-700">{b}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )

  const EducationBlock = () => (
    <>
      {educationItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-px w-10 ${theme.dividerClass}`} />
              <h2 className={theme.headingClass}>Education</h2>
              <div className={`h-px flex-1 ${theme.dividerClass}`} />
            </div>
          </div>
          <div className="space-y-5">
            {educationItems.map((edu: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-gray-900 text-base">{edu.degree}</span>
                    <span className="text-gray-400 text-sm">in</span>
                    <span className="font-medium text-gray-800 text-base">{edu.field}</span>
                  </div>
                  <div className="text-gray-600 text-sm">{edu.school}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span>{edu.startDate}</span>
                      <span className="text-gray-400">–</span>
                      <span>{edu.endDate}</span>
                    </div>
                    {edu.gpa && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">GPA:</span>
                        <span className="font-medium">{edu.gpa}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const AchievementsBlock = () => (
    <>
      {achievementsItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-px w-10 ${theme.dividerClass}`} />
              <h2 className={theme.headingClass}>Achievements</h2>
              <div className={`h-px flex-1 ${theme.dividerClass}`} />
            </div>
          </div>
          <div className="space-y-4">
            {achievementsItems.map((ach: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900 text-base flex-1">{ach.title}</span>
                      {ach.date && <span className="text-sm text-gray-500">{ach.date}</span>}
                    </div>
                    {ach.description && (
                      <div className="text-sm text-gray-600 leading-relaxed">{ach.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const ProjectsBlock = () => (
    <>
      {projectsItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-px w-10 ${theme.dividerClass}`} />
              <h2 className={theme.headingClass}>Projects</h2>
              <div className={`h-px flex-1 ${theme.dividerClass}`} />
            </div>
          </div>
          <div className="space-y-4">
            {projectsItems.map((p: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-base">{p.name}</span>
                    {p.url && (
                      <span className="text-xs text-blue-600 break-all">{p.url}</span>
                    )}
                  </div>
                  {p.description && (
                    <div className="text-sm text-gray-600 leading-relaxed">{p.description}</div>
                  )}
                  {Array.isArray(p.highlights) && p.highlights.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {p.highlights.map((h: string, hi: number) => (
                        <li key={hi} className="relative flex items-start gap-3">
                          <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
                          <div className="flex-1 pl-5">
                            <div className="text-sm leading-relaxed text-gray-700">{h}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const CertificationsBlock = () => (
    <>
      {certificationsItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-px w-10 ${theme.dividerClass}`} />
              <h2 className={theme.headingClass}>Certifications</h2>
              <div className={`h-px flex-1 ${theme.dividerClass}`} />
            </div>
          </div>
          <div className="space-y-4">
            {certificationsItems.map((c: any, idx: number) => (
              <div key={idx} className="relative">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900 text-base flex-1">{c.name}</span>
                      {c.date && <span className="text-sm text-gray-500">{c.date}</span>}
                    </div>
                    {(c.issuer || c.description) && (
                      <div className="text-sm text-gray-600 leading-relaxed">{[c.issuer, c.description].filter(Boolean).join(' — ')}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const SkillsBlock = () => (
    <>
      {Array.isArray(skillsContent?.groups) && skillsContent.groups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-px w-10 ${theme.dividerClass}`} />
              <h2 className={theme.headingClass}>Skills</h2>
              <div className={`h-px flex-1 ${theme.dividerClass}`} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillsContent.groups.flatMap((g: any) => Array.isArray(g?.skills) ? g.skills : []).map((s: string, i: number) => (
              <span key={i} className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-100 text-gray-800">{s}</span>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const renderByType = (type: string, key: number) => {
    switch (type) {
      case 'summary':
        return <SummaryBlock key={`s-${key}`} />
      case 'experience':
        return <ExperienceBlock key={`e-${key}`} />
      case 'education':
        return <EducationBlock key={`ed-${key}`} />
      case 'achievements':
        return <AchievementsBlock key={`a-${key}`} />
      case 'projects':
        return <ProjectsBlock key={`p-${key}`} />
      case 'certifications':
        return <CertificationsBlock key={`c-${key}`} />
      case 'skills':
        return <SkillsBlock key={`sk-${key}`} />
      default:
        return null
    }
  }
  const spanClass = (n: number) => (n === 1 ? 'col-span-1' : n === 2 ? 'col-span-2' : 'col-span-3')

  return (
    <div className={`resume-document mx-auto ${theme.rootClass}`} style={style}>
      <div className={contentClass}>
        {/* Personal Info */}
        <div>
          <div className={(template.headerAlign === 'center' ? 'text-center' : 'text-left') + ' pb-6 mb-6 ' + (template.headerDivider !== false ? 'border-b border-gray-200' : '')}>
            <div className="text-3xl font-bold text-gray-900 mb-2">{pi.fullName || data.name || ''}</div>
            <div className={'flex flex-wrap ' + (template.headerAlign === 'center' ? 'justify-center' : 'justify-start') + ' items-center gap-y-2 text-sm text-gray-600'}>
              {[pi.email, pi.phone, pi.location, pi.linkedin]
                .filter(Boolean)
                .map((v, idx) => (
                  <div key={idx} className={idx > 0 ? 'relative pl-4 before:content-["•"] before:text-gray-400 before:absolute before:left-1 before:top-1/2 before:-translate-y-1/2' : ''}>
                    {String(v)}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Sections - respect current order */}
        {template.layout.kind === 'singleColumn' ? (
          <div className="space-y-8">
            {sections.map((s, i) => renderByType(s.type, i))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-8">
            <div className={`${spanClass(template.layout.leftColSpan || 1)} space-y-8`}>
              {template.leftBand?.enabled && (
                <SidebarBand
                  photoUrl={(data as any)?.personal_info?.photoUrl || null}
                  nameInitial={(data as any)?.personal_info?.fullName ? String((data as any)?.personal_info?.fullName).trim().charAt(0).toUpperCase() : null}
                />
              )}
              {(() => {
                const leftTypes = new Set(template.layout.kind === 'twoColumn' ? (template.layout as any).left : [])
                const left = sections.filter((s) => leftTypes.has(s.type))
                return left.map((s, i) => renderByType(s.type, i))
              })()}
            </div>
            <div className={`${spanClass(template.layout.rightColSpan || 2)} space-y-8`}>
              {(() => {
                const leftTypes = new Set(template.layout.kind === 'twoColumn' ? (template.layout as any).left : [])
                const rightTypes = new Set(template.layout.kind === 'twoColumn' ? (template.layout as any).right : [])
                const right = sections.filter((s) => rightTypes.has(s.type) || !leftTypes.has(s.type))
                return right.map((s, i) => renderByType(s.type, i))
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumePrintDocument


