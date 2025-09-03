import { useState } from 'react'
import type { AutofillState, TemplatesState } from '@/types/autofill'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { improveAutofillTemplateWithRefresh } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'

export interface TemplateEditorProps {
  value: TemplatesState
  onChange: (value: TemplatesState) => void
  previewWith?: AutofillState
}

const placeholders = [
  '{recipient_name}', '{company}', '{role}', '{full_name}', '{years_experience}', '{desired_role}', '{primary_skills}', '{linkedin_url}', '{github_url}', '{portfolio_url}'
]

export function TemplateEditor({ value, onChange, previewWith }: TemplateEditorProps) {
  const { getToken } = useAuthToken()
  const [improving, setImproving] = useState<'email' | 'linkedin' | null>(null)

  const runImprove = async (kind: 'email' | 'linkedin') => {
    if (!previewWith) return
    setImproving(kind)
    try {
      const placeholdersList = placeholders
      const template = kind === 'email' ? value.emailTemplate : value.linkedinTemplate
      const out = await improveAutofillTemplateWithRefresh(getToken, {
        template,
        placeholders: placeholdersList,
        autofill: previewWith.inputs,
        resume: undefined,
        jdText: previewWith.compare.jdText,
        suggestions: previewWith.compare.suggestions || [],
      })
      const next = kind === 'email' ? { ...value, emailTemplate: out.improved } : { ...value, linkedinTemplate: out.improved }
      onChange(next)
    } finally {
      setImproving(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Placeholders Section */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">Available Placeholders</h3>
        <p className="text-muted-foreground mb-6">Click to copy these placeholders into your templates</p>
        <div className="flex flex-wrap gap-3">
          {placeholders.map((p) => (
            <Badge key={p} variant="secondary" className="font-mono cursor-pointer hover:bg-muted/60 transition-colors px-3 py-1.5">{p}</Badge>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-foreground mb-3">Template Editor</h3>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="email">Email Template</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn DM</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-6">
            <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-center lg:text-left">
                  <h4 className="text-md font-semibold text-foreground">Template</h4>
                </div>
                <Textarea 
                  rows={16} 
                  value={value.emailTemplate} 
                  onChange={(e) => onChange({ ...value, emailTemplate: e.target.value })}
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] min-h-[400px] resize-none"
                  placeholder="Dear {recipient_name},&#10;&#10;I hope this message finds you well..."
                />
                <button
                  className="hidden xl:block absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs"
                  onClick={() => runImprove('email')}
                  disabled={improving !== null}
                  title="AI Improve"
                >{improving === 'email' ? 'Improving…' : 'AI Improve'}</button>
              </div>
              {previewWith && (
                <div className="space-y-2">
                  <div className="text-center lg:text-left">
                    <h4 className="text-md font-semibold text-foreground">Preview</h4>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-6 border border-border min-h-[400px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{renderTemplatePreview(value.emailTemplate, previewWith)}</pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-6">
            <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-center lg:text-left">
                  <h4 className="text-md font-semibold text-foreground">LinkedIn DM Template</h4>
                </div>
                <Textarea 
                  rows={16} 
                  value={value.linkedinTemplate} 
                  onChange={(e) => onChange({ ...value, linkedinTemplate: e.target.value })}
                  className="border-border bg-muted/20 text-foreground focus:border-primary focus:ring-[--ring] min-h-[400px] resize-none"
                  placeholder="Hi {recipient_name}! I noticed your role at {company}..."
                />
                <button
                  className="hidden xl:block absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs"
                  onClick={() => runImprove('linkedin')}
                  disabled={improving !== null}
                  title="AI Improve"
                >{improving === 'linkedin' ? 'Improving…' : 'AI Improve'}</button>
              </div>
              {previewWith && (
                <div className="space-y-2">
                  <div className="text-center lg:text-left">
                    <h4 className="text-md font-semibold text-foreground">Preview</h4>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-6 border border-border min-h-[400px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{renderTemplatePreview(value.linkedinTemplate, previewWith)}</pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function renderTemplatePreview(tpl: string, state: AutofillState): string {
  const map: Record<string, string> = {
    recipient_name: '',
    company: state.compare.extractedCompany || '',
    role: state.compare.extractedRole || state.inputs.desiredRole || '',
    full_name: state.inputs.fullName || '',
    years_experience: state.inputs.yearsOfExperience || '',
    desired_role: state.inputs.desiredRole || '',
    primary_skills: state.inputs.primarySkills || '',
    linkedin_url: state.inputs.linkedinUrl || '',
    github_url: state.inputs.githubUrl || '',
    portfolio_url: state.inputs.portfolioUrl || '',
  }
  return tpl.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => map[key] || '')
}

export default TemplateEditor


