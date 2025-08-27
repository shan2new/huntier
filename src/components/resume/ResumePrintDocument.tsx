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
  const skillsContent: any = getSection('skills')?.content || { groups: [] }

  return (
    <div className="resume-document mx-auto" style={{ colorScheme: 'light' }}>
      <div className="py-12 space-y-8 resume-content">
        {/* Personal Info */}
        <div>
          <div className="text-center pb-6 mb-6 border-b border-gray-200">
            <div className="text-3xl font-bold text-gray-900 mb-2">{pi.fullName || data.name || ''}</div>
            <div className="flex flex-wrap justify-center items-center gap-y-2 text-sm text-gray-600">
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

        {/* Sections */}
        <div className="space-y-8">
          {/* Summary */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-px bg-border w-10" />
                <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">Professional Summary</h2>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>
            {summaryText && (
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{summaryText}</p>
            )}
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-px bg-border w-10" />
                <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">Work Experience</h2>
                <div className="h-px bg-border flex-1" />
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

          {/* Education */}
          {educationItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-px bg-border w-10" />
                  <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">Education</h2>
                  <div className="h-px bg-border flex-1" />
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

          {/* Achievements */}
          {achievementsItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-px bg-border w-10" />
                  <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">Achievements</h2>
                  <div className="h-px bg-border flex-1" />
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

          {/* Skills */}
          {Array.isArray(skillsContent?.groups) && skillsContent.groups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-px bg-border w-10" />
                  <h2 className="shrink-0 text-[12px] sm:text-[13px] font-medium tracking-[0.12em] uppercase text-foreground">Skills</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsContent.groups.flatMap((g: any) => Array.isArray(g?.skills) ? g.skills : []).map((s: string, i: number) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-md border border-gray-200 bg-gray-100 text-gray-800">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumePrintDocument


