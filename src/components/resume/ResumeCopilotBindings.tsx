import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { useCopilotChatSuggestions } from '@copilotkit/react-ui'
import { aiEnhanceTextWithRefresh } from '@/lib/api'
import { toast } from '@/components/ui/toaster'
import { useAuthToken } from '@/lib/auth'

type Props = { state: any }

export function ResumeCopilotBindings({ state }: Props) {
  const { getToken } = useAuthToken()

  const copilotContext = {
    id: state.resumeData?.id,
    summary: String(state.resumeData?.summary || '').trim(),
    expCount: Array.isArray(state.resumeData?.experience) ? state.resumeData.experience.length : 0,
    skillsCount: Array.isArray(state.skillsTags) ? state.skillsTags.length : 0,
  }

  const analyzeResumeHandler = useCallback(async () => {
    try {
      const hints: Array<string> = []
      if (!copilotContext.summary) hints.push('Add a concise, quantified summary (2-3 sentences).')
      if (copilotContext.expCount === 0) hints.push('Add at least one experience with quantified bullets.')
      if (copilotContext.skillsCount < 3) hints.push('Add a focused skills section (6-12 skills).')
      const ctx = `Resume quick facts: summary_len=${copilotContext.summary.length}, experiences=${copilotContext.expCount}, skills_count=${copilotContext.skillsCount}.`
      const res: any = await aiEnhanceTextWithRefresh(copilotContext.id!, getToken, {
        text: [
          'Analyze resume for problems and improvement opportunities.',
          'Focus on ATS alignment, clarity, quantification, verbosity, ordering, and missing keywords.',
          'Return a short, actionable checklist (bulleted).',
          ctx,
          hints.length ? `Initial hints: ${hints.join(' | ')}` : '',
        ].filter(Boolean).join('\n'),
        mode: 'proofread',
        contentType: 'paragraph',
        tone: 'concise',
      })
      const text = typeof res?.text === 'string' ? res.text : 'No issues detected.'
      return text
    } catch {
      return 'Failed to analyze. Please try again after saving your resume.'
    }
  }, [copilotContext, getToken])

  useCopilotAction(
    {
      name: 'analyzeResume',
      description: 'Analyze the current resume for potential issues and improvements. Return plain text.',
      handler: analyzeResumeHandler,
    },
    undefined
  )

  useCopilotAction(
    {
      name: 'applyExperienceBulletsUpdate',
      description: 'Confirm and replace bullets for an experience item at index.',
      parameters: [
        { name: 'index', type: 'number', description: 'Experience item index (0-based)', required: true },
        { name: 'bullets', type: 'string[]', description: 'Proposed bullets list', required: true },
        { name: 'note', type: 'string', description: 'Change note', required: false },
      ],
      renderAndWaitForResponse: ({ args, respond }) => {
        const index = Number((args as any)?.index ?? -1)
        const proposedRaw = (args as any)?.bullets
        const proposed = Array.isArray(proposedRaw) ? proposedRaw.map((b: any) => String(b)).filter(Boolean) : []
        const note = String((args as any)?.note || '')
        const currExp = Array.isArray(state.resumeData?.experience) ? state.resumeData.experience : []
        const current = (currExp[index]?.bullets || []).map((b: any) => String(b))
        return (
          <Card className="max-w-[520px]">
            <CardHeader>
              <CardTitle>Replace bullets for role #{index + 1}?</CardTitle>
              <CardDescription>{note || 'Review current vs proposed bullets.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Current ({current.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {current.length ? current.map((s: string, i: number) => (<Badge key={`c-${i}`} variant="secondary">{s}</Badge>)) : <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Proposed ({proposed.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {proposed.length ? proposed.map((s: string, i: number) => (<Badge key={`p-${i}`}>{s}</Badge>)) : <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => (respond as (v: string) => void)('cancel')}>Cancel</Button>
              <Button onClick={() => {
                if (index < 0) { (respond as (v: string) => void)('invalid'); return }
                state.replaceExperienceBullets(index, proposed)
                void state.handleSave(false)
                ;(respond as (v: string) => void)('applied')
              }}>Apply</Button>
            </CardFooter>
          </Card>
        )
      },
    },
    undefined
  )

  useCopilotAction(
    {
      name: 'applySummaryUpdate',
      description: 'Confirm and apply a rewritten professional summary.',
      parameters: [
        { name: 'proposed', type: 'string', description: 'Proposed summary text', required: true },
        { name: 'note', type: 'string', description: 'Change explanation', required: false },
      ],
      renderAndWaitForResponse: ({ args, respond }) => {
        const proposed = String((args as any)?.proposed || '').trim()
        const note = String((args as any)?.note || '')
        const current = String(state.resumeData?.summary || '')
        return (
          <Card className="max-w-[520px]">
            <CardHeader>
              <CardTitle>Replace summary?</CardTitle>
              <CardDescription>{note || 'Review current vs proposed summary.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Current</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{current || '(empty)'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Proposed</div>
                  <div className="text-sm whitespace-pre-wrap">{proposed || '(empty)'}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => (respond as (v: string) => void)('cancel')}>Cancel</Button>
              <Button onClick={() => { state.setSummaryText(proposed); void state.handleSave(false); (respond as (v: string) => void)('applied') }}>Apply</Button>
            </CardFooter>
          </Card>
        )
      },
    },
    undefined
  )

  useCopilotAction(
    {
      name: 'applySkillsUpdate',
      description: 'Confirm and apply a proposed full skills list update (e.g., condense, dedupe, normalize). Always show a confirm UI before applying.',
      parameters: [
        { name: 'proposed', type: 'string[]', description: 'Final proposed skills list to set on the resume', required: true },
        { name: 'summary', type: 'string', description: 'Short explanation of the changes', required: false },
        { name: 'added', type: 'string[]', description: 'Skills added compared to current list', required: false },
        { name: 'removed', type: 'string[]', description: 'Skills removed compared to current list', required: false },
      ],
      renderAndWaitForResponse: ({ args, respond }) => {
        const currentSkills = Array.isArray(state.skillsTags) ? state.skillsTags : []
        const proposedRaw = (args as any)?.proposed
        const proposed = Array.isArray(proposedRaw) ? proposedRaw.map((s: any) => String(s).trim()).filter(Boolean) : []
        const summaryNote = typeof (args as any)?.summary === 'string' ? (args as any).summary : ''
        const currentSet = new Set(currentSkills.map((s: string) => s.toLowerCase()))
        const proposedSet = new Set(proposed.map((s: string) => s.toLowerCase()))
        const added = Array.isArray((args as any)?.added) ? (args as any).added : proposed.filter((s: string) => !currentSet.has(String(s).toLowerCase()))
        const removed = Array.isArray((args as any)?.removed) ? (args as any).removed : currentSkills.filter((s: string) => !proposedSet.has(String(s).toLowerCase()))
        return (
          <Card className="max-w-[520px]">
            <CardHeader>
              <CardTitle>Apply skills update?</CardTitle>
              <CardDescription>
                {summaryNote || 'The assistant proposes updating the skills list as shown below.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Current ({currentSkills.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {currentSkills.map((s: string, i: number) => (<Badge key={`${s}-${i}`} variant="secondary">{s}</Badge>))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Proposed ({proposed.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {proposed.map((s: string, i: number) => (<Badge key={`${s}-${i}`}>{s}</Badge>))}
                  </div>
                </div>
                {(added.length > 0 || removed.length > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Added</div>
                      <div className="flex flex-wrap gap-1">
                        {added.length > 0 ? added.map((s: string, i: number) => (<Badge key={`add-${s}-${i}`} variant="outline">{s}</Badge>)) : (<span className="text-xs text-muted-foreground">None</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Removed</div>
                      <div className="flex flex-wrap gap-1">
                        {removed.length > 0 ? removed.map((s: string, i: number) => (<Badge key={`rem-${s}-${i}`} variant="outline">{s}</Badge>)) : (<span className="text-xs text-muted-foreground">None</span>)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => { (respond as (v: string) => void)('cancel') }}>Cancel</Button>
              <Button onClick={() => {
                if (proposed.length === 0) { (respond as (v: string) => void)('no-op'); return }
                state.setSkillsFromTags(proposed)
                toast.success('Skills updated', { description: 'Applied assistant suggestions.' })
                void state.handleSave(false)
                ;(respond as (v: string) => void)('applied')
              }}>Apply</Button>
            </CardFooter>
          </Card>
        )
      },
    },
    undefined
  )

  const copilotReadableValue = {
    id: state.resumeData?.id,
    name: state.resumeData?.name,
    summary: state.resumeData?.summary,
    experience: Array.isArray(state.resumeData?.experience) ? state.resumeData.experience.slice(0, 5) : [],
    skills: Array.isArray(state.skillsTags) ? state.skillsTags.slice(0, 24) : [],
  }

  useCopilotReadable(
    { description: 'Current resume state...', value: copilotReadableValue },
    [state.resumeData?.id, state.resumeData?.name, state.resumeData?.summary, (state.resumeData?.experience || []).length, (state.skillsTags || []).length]
  )

  useCopilotChatSuggestions(
    { instructions: 'Suggest helpful actions for resume editing and JD alignment.', minSuggestions: 2, maxSuggestions: 3 },
    undefined
  )

  return null
}

export default ResumeCopilotBindings


