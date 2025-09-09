import { AnimatePresence } from 'motion/react'
import { useSelector } from 'react-redux'
import { selectExperienceItems, selectEducationItems, selectAchievementItems, selectProjectItems, selectCertificationItems, selectDenormalizedSections } from '../../state/selectors'
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
import { useResumeEditor } from '../../context/ResumeEditorContext'
import '@/components/resume/resume-editor.css'

export function ResumeRenderer() {
  const editor = useResumeEditor()
  const experienceItems = useSelector(selectExperienceItems)
  const educationItems = useSelector(selectEducationItems)
  const achievementItems = useSelector(selectAchievementItems)
  const projectItems = useSelector(selectProjectItems)
  const certificationItems = useSelector(selectCertificationItems)
  const sections = useSelector(selectDenormalizedSections)
  const resumeData: any = editor.resumeData
  const theme = getResumeTheme(resumeData?.theme?.id as any)
  const chosenFont = getResumeFont((resumeData?.theme as any)?.font)
  const style = { colorScheme: 'light' as const, fontFamily: (chosenFont.stack || theme.fontFamily) }
  const contentClass = `${theme.contentClass || 'px-16 py-16'} space-y-8 resume-content ${theme.bodyClass}`
  const template = getResumeTemplate(resumeData.template_id as any)
  const spanClass = (n: number) => (n === 1 ? 'col-span-1' : n === 2 ? 'col-span-2' : 'col-span-3')

  const renderSection = (section: any, _index: number) => {
    switch (section.type) {
      case 'summary':
        return (
          <div key={section.id} data-section="summary">
            <SummarySection text={section.content?.text || ''} onChange={editor.setSummaryText} onEnhance={editor.enhanceSummary} />
          </div>
        )
      case 'experience': {
        const expItems = experienceItems
        return (
          <div key={section.id} data-section="experience">
            <ExperienceSection
              items={expItems}
              onAddItem={editor.addExperienceItem}
              onRemoveItem={editor.removeExperienceItem}
              onChangeField={editor.setExperienceField as any}
              onAddBullet={editor.addExperienceBullet}
              onRemoveBullet={editor.removeExperienceBullet}
              onChangeBullet={editor.setExperienceBullet}
              onEnhanceBullet={editor.enhanceExperienceBullet}
              onSuggestBullets={editor.suggestBullets}
            />
          </div>
        )
      }
      case 'education': {
        const eduItems = educationItems
        return (
          <div key={section.id} data-section="education">
            <EducationSection
              items={eduItems}
              onAddItem={editor.addEducationItem}
              onRemoveItem={editor.removeEducationItem}
              onChangeField={editor.setEducationField as any}
            />
          </div>
        )
      }
      case 'achievements': {
        const achItems = achievementItems
        return (
          <div key={section.id} data-section="achievements">
            <AchievementsSection
              items={achItems}
              onAddItem={editor.addAchievementItem}
              onRemoveItem={editor.removeAchievementItem}
              onChangeField={editor.setAchievementField as any}
            />
          </div>
        )
      }
      case 'projects': {
        const projItems = projectItems
        return (
          <div key={section.id} data-section="projects">
            <ProjectsSection
              items={projItems}
              onAddItem={editor.addProjectItem}
              onRemoveItem={editor.removeProjectItem}
              onChangeField={editor.setProjectField as any}
              onAddHighlight={editor.addProjectHighlight}
              onRemoveHighlight={editor.removeProjectHighlight}
              onChangeHighlight={editor.setProjectHighlight}
            />
          </div>
        )
      }
      case 'skills':
        return (
          <div key={section.id} data-section="skills">
            <SkillsSection tags={editor.skillsTags} onChange={editor.setSkillsFromTags} />
          </div>
        )
      case 'certifications': {
        const certItems = certificationItems
        return (
          <div key={section.id} data-section="certifications">
            <CertificationsSection
              items={certItems}
              onAddItem={editor.addCertificationItem}
              onRemoveItem={editor.removeCertificationItem}
              onChangeField={editor.setCertificationField as any}
            />
          </div>
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
          <ResumeThemeProvider theme={theme}>
            <div className={`resume-document mx-auto ${theme.rootClass}`} style={style}>
              <div className={contentClass}>
                <div data-section="personal-info">
                  <PersonalInfoSection
                    personalInfo={resumeData.personal_info}
                    onChange={(field, value) => editor.updatePersonalInfo(field, value)}
                    align={template.headerAlign}
                    divider={template.headerDivider !== false}
                    headerStyle={template.headerStyle || 'default'}
                    showPhotoControls={!!template.leftBand?.enabled}
                  />
                </div>
                <AnimatePresence>
                  {(() => {
                    const sorted = [...sections]
                    if (template.layout.kind === 'singleColumn') {
                      return <>{sorted.map((s, i) => renderSection(s, i))}</>
                    } else {
                      const leftTypes = new Set(template.layout.left)
                      const rightTypes = new Set(template.layout.right)
                      const left = sorted.filter((s) => leftTypes.has(s.type))
                      const right = sorted.filter((s) => rightTypes.has(s.type) || !leftTypes.has(s.type))
                      const span = (n: number) => spanClass(n)
                      return (
                        <div className="grid grid-cols-3 gap-8">
                          <div className={`${span(template.layout.leftColSpan || 1)} space-y-8`}>
                            {template.leftBand?.enabled && (
                              <SidebarBand
                                photoUrl={(resumeData.personal_info as any)?.photoUrl || null}
                                nameInitial={(resumeData.personal_info as any)?.fullName ? String((resumeData.personal_info as any).fullName).trim().charAt(0).toUpperCase() : null}
                              />
                            )}
                            {left.map((s, i) => renderSection(s, i))}
                          </div>
                          <div className={`${span(template.layout.rightColSpan || 2)} space-y-8`}>
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
        </div>
      </div>
    </div>
  )
}

export default ResumeRenderer


