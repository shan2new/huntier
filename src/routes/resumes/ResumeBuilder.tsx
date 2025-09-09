import { CopilotChat } from '@copilotkit/react-ui'
import { useMemo, useEffect } from 'react'
import { CompactTopToolbar } from '@/components/resume/CompactTopToolbar'
import { ResumeDocument } from '@/components/resume/ResumeDocument'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useResumeStore } from '@/hooks/useResumeStore'
import { ResumeCopilotBindings } from '@/components/resume/ResumeCopilotBindings'

export function ResumeBuilder({ resumeId }: { resumeId: string }) {
  const state = useResumeStore(resumeId)
  useEffect(() => { state.ensureSeed?.() }, [])
  const resumeData = state.resumeData
  const saving = state.saving
  const hasUnsavedChanges = state.hasUnsavedChanges
  const handleSave = state.handleSave
  const availableSections = state.availableSections
  const addSection = state.addSection
  const skillsTags = state.skillsTags
  const setSummaryText = state.setSummaryText
  const enhanceSummary = state.enhanceSummary
  const addExperienceItem = state.addExperienceItem
  const removeExperienceItem = state.removeExperienceItem
  const setExperienceField = state.setExperienceField
  const addExperienceBullet = state.addExperienceBullet
  const removeExperienceBullet = state.removeExperienceBullet
  const setExperienceBullet = state.setExperienceBullet
  const enhanceExperienceBullet = state.enhanceExperienceBullet
  const suggestBullets = state.suggestBullets
  const addEducationItem = state.addEducationItem
  const removeEducationItem = state.removeEducationItem
  const setEducationField = state.setEducationField
  const addAchievementItem = state.addAchievementItem
  const removeAchievementItem = state.removeAchievementItem
  const setAchievementField = state.setAchievementField
  const addProjectItem = state.addProjectItem
  const removeProjectItem = state.removeProjectItem
  const setProjectField = state.setProjectField
  const addProjectHighlight = state.addProjectHighlight
  const removeProjectHighlight = state.removeProjectHighlight
  const setProjectHighlight = state.setProjectHighlight
  const addCertificationItem = state.addCertificationItem
  const removeCertificationItem = state.removeCertificationItem
  const setCertificationField = state.setCertificationField
  const setSkillsFromTags = state.setSkillsFromTags
  const updatePersonalInfo = state.updatePersonalInfo
  const setName = state.setName
  const setTemplateId = state.setTemplateId
  const setFontId = state.setFontId
  const setThemeId = state.setThemeId

  // Stable chat props to avoid re-renders causing update depth issues
  const chatInstructions = useMemo(() => (
    'You are assisting the user as best as you can. Answer in the best way possible given the data you have.'
  ), [])
  const chatLabels = useMemo(() => ({
    title: 'Sidebar Assistant',
    initial: 'How can I help you today?',
  }), [])

  return (
    <div className="document-viewer h-full overflow-hidden">
      <div className="px-0 py-0 h-full w-full flex flex-col overflow-hidden">
        <CompactTopToolbar
          name={resumeData.name}
          onNameChange={setName}
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaved={null}
          templateId={resumeData.template_id as any}
          onTemplateChange={setTemplateId as any}
          fontId={(resumeData.theme as any)?.font}
          onFontChange={setFontId as any}
          themeId={resumeData.theme.id}
          onThemeChange={setThemeId as any}
          availableSections={availableSections}
          onAddSection={addSection}
          onOpenJdHub={() => {}}
          onClearChat={() => {}}
          onExportPdf={() => {}}
          onExportDocx={() => {}}
          onImportPdf={() => {}}
          importing={state.importing}
          exporting={state.exporting}
          onSave={handleSave}
        />
        <ResizablePanelGroup direction="horizontal" className="flex-1 items-stretch ml-8 rounded-none border-none bg-none overflow-hidden">
          <ResizablePanel defaultSize={70} minSize={40} className="pr-6">
            <div className="flex flex-row gap-4 h-full min-h-0 overflow-hidden">
              <ScrollArea className="h-full pr-2">
                <>
                  <ResumeCopilotBindings state={state} />
                  <ResumeDocument
                    resumeData={resumeData}
                    skillsTags={skillsTags}
                    onSummaryChange={setSummaryText}
                    onEnhanceSummary={enhanceSummary}
                    onAddExperienceItem={addExperienceItem}
                    onRemoveExperienceItem={removeExperienceItem}
                    onChangeExperienceField={setExperienceField}
                    onAddExperienceBullet={addExperienceBullet}
                    onRemoveExperienceBullet={removeExperienceBullet}
                    onChangeExperienceBullet={setExperienceBullet}
                    onEnhanceExperienceBullet={enhanceExperienceBullet}
                    onSuggestBullets={suggestBullets}
                    onAddEducationItem={addEducationItem}
                    onRemoveEducationItem={removeEducationItem}
                    onChangeEducationField={setEducationField}
                    onAddAchievementItem={addAchievementItem}
                    onRemoveAchievementItem={removeAchievementItem}
                    onChangeAchievementField={setAchievementField}
                    onAddProjectItem={addProjectItem}
                    onRemoveProjectItem={removeProjectItem}
                    onChangeProjectField={setProjectField}
                    onAddProjectHighlight={addProjectHighlight}
                    onRemoveProjectHighlight={removeProjectHighlight}
                    onChangeProjectHighlight={setProjectHighlight}
                    onAddCertificationItem={addCertificationItem}
                    onRemoveCertificationItem={removeCertificationItem}
                    onChangeCertificationField={setCertificationField}
                    onSkillsChange={setSkillsFromTags}
                    onPersonalInfoChange={updatePersonalInfo}
                    jdHints={state.jdHints}
                  />
                </>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={22} className="hidden lg:block">
            <div className="h-full">
              <CopilotChat
                className="h-full rounded-none border-0 bg-background"
                instructions={chatInstructions}
                labels={chatLabels}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default ResumeBuilder


