import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "bg-background text-foreground data-[panel-group-direction=vertical]:h-full data-[panel-group-direction=horizontal]:w-full",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean }) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative z-30 flex items-center justify-center shrink-0 select-none",
      // Render a clearly visible divider line
      "bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors",
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
      // Slightly thicker vertical divider for visibility
      "data-[panel-group-direction=horizontal]:h-full data-[panel-group-direction=horizontal]:w-1",
      "data-[panel-group-direction=vertical]:cursor-row-resize data-[panel-group-direction=horizontal]:cursor-col-resize",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div
        className={cn(
          "z-10 flex items-center justify-center rounded-sm border bg-green",
          "data-[panel-group-direction=vertical]:h-4 data-[panel-group-direction=vertical]:w-3",
          "data-[panel-group-direction=horizontal]:h-3 data-[panel-group-direction=horizontal]:w-4"
        )}
      >
        <div
          className={cn(
            "bg-green-500 rounded-sm",
            "data-[panel-group-direction=vertical]:h-2 data-[panel-group-direction=vertical]:w-0.5",
            "data-[panel-group-direction=horizontal]:h-0.5 data-[panel-group-direction=horizontal]:w-2"
          )}
        />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }


