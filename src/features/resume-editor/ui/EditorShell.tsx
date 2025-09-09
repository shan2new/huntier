import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResumeToolbar } from './Toolbar/ResumeToolbar'
import { ResumeRenderer } from './Canvas/ResumeRenderer'
import { CopilotPanel } from './Panels/Right/CopilotPanel'

export function EditorShell() {
  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <ResumeToolbar />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={55} className="px-8">
          <ScrollArea className="h-full"><ResumeRenderer /></ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={22} className="hidden xl:block font-[Outfit]">
          <CopilotPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default EditorShell


