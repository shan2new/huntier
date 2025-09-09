import type { SectionPlugin } from './index'
import { resumeEditorActions } from '../state/resumeEditorSlice'

export const experiencePlugin: SectionPlugin<'experience'> = {
  type: 'experience',
  copilot: {
    tools: [
      { name: 'add_experience', description: 'Add a new experience item', handler: async () => {} },
    ],
  },
}

export function registerExperiencePlugin(registry: Record<string, SectionPlugin>, dispatch?: any) {
  const plugin = { ...experiencePlugin }
  if (dispatch) {
    plugin.copilot = plugin.copilot || {}
    plugin.copilot.tools = (plugin.copilot.tools || []).map((t) => ({
      ...t,
      handler: async (_args: any) => {
        if (t.name === 'add_experience') dispatch(resumeEditorActions.addExperienceItem())
      }
    }))
  }
  registry['experience'] = plugin
}


