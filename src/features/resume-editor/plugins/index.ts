export type CopilotTool = {
  name: string
  description: string
  parameters?: any
  handler: (args: any) => Promise<void> | void
}

export type SectionPlugin<TType extends string = string> = {
  type: TType
  copilot?: {
    readable?: Array<{ name: string; selector: () => any }>
    tools?: CopilotTool[]
  }
}

export const sectionRegistry: Record<string, SectionPlugin> = {}


