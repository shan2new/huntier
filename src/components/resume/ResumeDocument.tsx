import { AnimatePresence, motion } from 'motion/react'
import { ResumeThemeProvider } from '@/components/resume/ThemeContext'
import { getResumeTheme } from '@/lib/themes'
import { getResumeFont } from '@/lib/fonts'
import { getResumeTemplate } from '@/lib/templates'
import { SidebarBand } from '@/components/resume/SidebarBand'
import { PersonalInfoSection } from '@/components/resume/PersonalInfoSection'
import { SummarySection } from '@/components/resume/SummarySection'
import { ExperienceSection } from '@/components/resume/ExperienceSection'
import { EducationSection } from '@/components/resume/EducationSection'
import { AchievementsSection } from '@/components/resume/AchievementsSection'
import { ProjectsSection } from '@/components/resume/ProjectsSection'
import { SkillsSection } from '@/components/resume/SkillsSection'
import { CertificationsSection } from '@/components/resume/CertificationsSection'
import '@/components/resume/resume-editor.css'

type ExperienceField = 'company' | 'role' | 'startDate' | 'endDate'

interface ResumeDocumentProps {
  resumeData: any
  skillsTags: string[]
  onSummaryChange: (text: string) => void
  onEnhanceSummary: (current: string) => Promise<string>
  onAddExperienceItem: () => void
  onRemoveExperienceItem: (index: number) => void
  onChangeExperienceField: (index: number, field: ExperienceField, value: string) => void
  onAddExperienceBullet: (index: number) => void
  onRemoveExperienceBullet: (index: number, bulletIndex: number) => void
  onChangeExperienceBullet: (index: number, bulletIndex: number, text: string) => void
  onEnhanceExperienceBullet: (index: number, bulletIndex: number, current: string) => Promise<string>
  onSuggestBullets: (index: number) => Promise<void> | void
  onAddEducationItem: () => void
  onRemoveEducationItem: (index: number) => void
  onChangeEducationField: (index: number, field: string, value: string) => void
  onAddAchievementItem: () => void
  onRemoveAchievementItem: (index: number) => void
  onChangeAchievementField: (index: number, field: string, value: string) => void
  onAddProjectItem: () => void
  onRemoveProjectItem: (index: number) => void
  onChangeProjectField: (index: number, field: string, value: string) => void
  onAddProjectHighlight: (index: number) => void
  onRemoveProjectHighlight: (index: number, highlightIndex: number) => void
  onChangeProjectHighlight: (index: number, highlightIndex: number, text: string) => void
  onSkillsChange: (tags: string[]) => void
  onPersonalInfoChange: (field: string, value: string) => void
  onAddCertificationItem: () => void
  onRemoveCertificationItem: (index: number) => void
  onChangeCertificationField: (index: number, field: string, value: string) => void
  jdHints: any[]
}

export function ResumeDocument({
  resumeData,
  skillsTags,
  onSummaryChange,
  onEnhanceSummary,
  onAddExperienceItem,
  onRemoveExperienceItem,
  onChangeExperienceField,
  onAddExperienceBullet,
  onRemoveExperienceBullet,
  onChangeExperienceBullet,
  onEnhanceExperienceBullet,
  onSuggestBullets,
  onAddEducationItem,
  onRemoveEducationItem,
  onChangeEducationField,
  onAddAchievementItem,
  onRemoveAchievementItem,
  onChangeAchievementField,
  onAddProjectItem,
  onRemoveProjectItem,
  onChangeProjectField,
  onAddProjectHighlight,
  onRemoveProjectHighlight,
  onChangeProjectHighlight,
  onSkillsChange,
  onPersonalInfoChange,
  onAddCertificationItem,
  onRemoveCertificationItem,
  onChangeCertificationField,
  jdHints: _jdHints,
}: ResumeDocumentProps) {
  const theme = getResumeTheme(resumeData.theme.id as any)
  const chosenFont = getResumeFont((resumeData.theme as any).font)
  const style = { colorScheme: 'light' as const, fontFamily: (chosenFont.stack || theme.fontFamily) }
  const contentClass = `${theme.contentClass || 'px-16 py-16'} space-y-8 resume-content ${theme.bodyClass}`
  const template = getResumeTemplate(resumeData.template_id as any)
  const spanClass = (n: number) => (n === 1 ? 'col-span-1' : n === 2 ? 'col-span-2' : 'col-span-3')

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'summary':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="summary"
          >
            <SummarySection text={section.content?.text || ''} onChange={onSummaryChange} onEnhance={onEnhanceSummary} />
          </motion.div>
        )
      case 'experience': {
        const expItems = section.content || []
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="experience"
          >
            <ExperienceSection
              items={expItems}
              onAddItem={onAddExperienceItem}
              onRemoveItem={onRemoveExperienceItem}
              onChangeField={onChangeExperienceField}
              onAddBullet={onAddExperienceBullet}
              onRemoveBullet={onRemoveExperienceBullet}
              onChangeBullet={onChangeExperienceBullet}
              onEnhanceBullet={onEnhanceExperienceBullet}
              onSuggestBullets={onSuggestBullets}
            />
          </motion.div>
        )
      }
      case 'education': {
        const eduItems = section.content || []
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="education"
          >
            <EducationSection
              items={eduItems}
              onAddItem={onAddEducationItem}
              onRemoveItem={onRemoveEducationItem}
              onChangeField={(idx, field, value) => onChangeEducationField(idx, field as any, value)}
            />
          </motion.div>
        )
      }
      case 'achievements': {
        const achItems = section.content || []
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="achievements"
          >
            <AchievementsSection
              items={achItems}
              onAddItem={onAddAchievementItem}
              onRemoveItem={onRemoveAchievementItem}
              onChangeField={(idx, field, value) => onChangeAchievementField(idx, field as any, value)}
            />
          </motion.div>
        )
      }
      case 'projects': {
        const projItems = section.content || []
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="projects"
          >
            <ProjectsSection
              items={projItems}
              onAddItem={onAddProjectItem}
              onRemoveItem={onRemoveProjectItem}
              onChangeField={(idx, field, value) => onChangeProjectField(idx, field as any, value)}
              onAddHighlight={onAddProjectHighlight}
              onRemoveHighlight={onRemoveProjectHighlight}
              onChangeHighlight={onChangeProjectHighlight}
            />
          </motion.div>
        )
      }
      case 'skills':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="skills"
          >
            <SkillsSection
              tags={skillsTags}
              onChange={onSkillsChange}
            />
          </motion.div>
        )
      case 'certifications': {
        const certItems = section.content || []
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
            data-section="certifications"
          >
            <CertificationsSection
              items={certItems}
              onAddItem={onAddCertificationItem}
              onRemoveItem={onRemoveCertificationItem}
              onChangeField={(idx, field, value) => onChangeCertificationField(idx, field as any, value)}
            />
          </motion.div>
        )
      }
      default:
        return null
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div>
        <div className="relative mb-8 last:mb-0">
          {(() => {
            return (
              <ResumeThemeProvider theme={theme}>
                <div
                  className={`resume-document mx-auto ${theme.rootClass}`}
                  style={style}
                >
                  <div className={contentClass}>
                    <div data-section="personal-info">
                      <PersonalInfoSection
                        personalInfo={resumeData.personal_info}
                        onChange={(field, value) => onPersonalInfoChange(field, value)}
                        align={template.headerAlign}
                        divider={template.headerDivider !== false}
                        headerStyle={template.headerStyle || 'default'}
                        showPhotoControls={!!template.leftBand?.enabled}
                      />
                    </div>

                    {(!resumeData.personal_info.fullName && !resumeData.summary && resumeData.sections.length <= 1) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="text-center py-16"
                      >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Let's build your resume</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                          Start by clicking on any section below to add your information.
                        </p>
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {(() => {
                        const sorted = [...resumeData.sections].sort((a, b) => a.order - b.order)
                        if (template.layout.kind === 'singleColumn') {
                          return (
                            <>
                              {sorted.map((s, i) => renderSection(s, i))}
                            </>
                          )
                        } else {
                          const leftTypes = new Set(template.layout.left)
                          const rightTypes = new Set(template.layout.right)
                          const left = sorted.filter((s) => leftTypes.has(s.type))
                          const right = sorted.filter((s) => rightTypes.has(s.type) || !leftTypes.has(s.type))
                          return (
                            <div className="grid grid-cols-3 gap-8">
                              <div className={`${spanClass(template.layout.leftColSpan || 1)} space-y-8`}>
                                {template.leftBand?.enabled && (
                                  <SidebarBand
                                    photoUrl={(resumeData.personal_info as any)?.photoUrl || null}
                                    nameInitial={(resumeData.personal_info as any)?.fullName ? String((resumeData.personal_info as any).fullName).trim().charAt(0).toUpperCase() : null}
                                  />
                                )}
                                {left.map((s, i) => renderSection(s, i))}
                              </div>
                              <div className={`${spanClass(template.layout.rightColSpan || 2)} space-y-8`}>
                                {right.map((s, i) => renderSection(s, i))}
                              </div>
                            </div>
                          )
                        }
                      })()}
                    </AnimatePresence>
                  </div>
                </div>
              </ResumeThemeProvider>
            )
          })()}
        </div>
      </div>
    </div>
  )
}


