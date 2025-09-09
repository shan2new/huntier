import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FilePreview } from "@/components/ui/file-preview"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

const chatBubbleVariants = cva(
  "group/message relative break-words rounded-lg p-3 text-sm sm:max-w-[70%] shadow-xs",
  {
    variants: {
      isUser: {
        true: "bg-primary text-primary-foreground",
        false: "bg-card text-card-foreground border border-border",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

interface Attachment {
  name?: string
  contentType?: string
  url: string
}

interface PartialToolCall {
  state: "partial-call"
  toolName: string
}

interface ToolCall {
  state: "call"
  toolName: string
  args?: any
}

interface ToolResult {
  state: "result"
  toolName: string
  result: {
    __cancelled?: boolean
    [key: string]: any
  }
  args?: any
}

type ToolInvocation = PartialToolCall | ToolCall | ToolResult

interface ReasoningPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocation
}

interface TextPart {
  type: "text"
  text: string
}

// For compatibility with AI SDK types, not used
interface SourcePart {
  type: "source"
  source?: any
}

interface FilePart {
  type: "file"
  mimeType: string
  data: string
}

interface StepStartPart {
  type: "step-start"
}

type MessagePart =
  | TextPart
  | ReasoningPart
  | ToolInvocationPart
  | SourcePart
  | FilePart
  | StepStartPart

export interface Message {
  id: string
  role: "user" | "assistant" | (string & {})
  content: string
  createdAt?: Date
  experimental_attachments?: Attachment[]
  toolInvocations?: ToolInvocation[]
  parts?: MessagePart[]
}

export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean
  animation?: Animation
  actions?: React.ReactNode
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "scale",
  actions,
  experimental_attachments,
  toolInvocations,
  parts,
}) => {
  const files = useMemo(() => {
    return experimental_attachments?.map((attachment) => {
      const dataArray = dataUrlToUint8Array(attachment.url)
      const file = new File([dataArray], attachment.name ?? "Unknown", {
        type: attachment.contentType,
      })
      return file
    })
  }, [experimental_attachments])

  const isUser = role === "user"

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isUser) {
    return (
      <div
        className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
      >
        {files ? (
          <div className="mb-1 flex flex-wrap gap-2">
            {files.map((file, index) => {
              return <FilePreview file={file} key={index} />
            })}
          </div>
        ) : null}

        <div className={cn(chatBubbleVariants({ isUser, animation }))}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className={cn(
              "mt-1 block px-1 text-xs opacity-50",
              animation !== "none" && "duration-500 animate-in fade-in-0"
            )}
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    )
  }

  if (parts && parts.length > 0) {
    return parts.map((part, index) => {
      if (part.type === "text") {
        return (
          <div
            className={cn(
              "flex flex-col",
              isUser ? "items-end" : "items-start"
            )}
            key={`text-${index}`}
          >
            {files ? (
              <div className="mb-1 flex flex-wrap gap-2">
                {files.map((file, fidx) => (
                  <FilePreview file={file} key={`file-${fidx}`} />
                ))}
              </div>
            ) : null}
            <div className={cn(chatBubbleVariants({ isUser, animation }))}>
              <MarkdownRenderer>{part.text}</MarkdownRenderer>
              {actions ? (
                <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
                  {actions}
                </div>
              ) : null}
            </div>

            {showTimeStamp && createdAt ? (
              <time
                dateTime={createdAt.toISOString()}
                className={cn(
                  "mt-1 block px-1 text-xs opacity-50",
                  animation !== "none" && "duration-500 animate-in fade-in-0"
                )}
              >
                {formattedTime}
              </time>
            ) : null}
          </div>
        )
      } else if (part.type === "reasoning") {
        return <ReasoningBlock key={`reasoning-${index}`} part={part} />
      } else if (part.type === "tool-invocation") {
        return (
          <ToolCall
            key={`tool-${index}`}
            toolInvocations={[part.toolInvocation]}
          />
        )
      }
      return null
    })
  }

  if (toolInvocations && toolInvocations.length > 0) {
    return (
      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        {files ? (
          <div className="mb-1 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <FilePreview file={file} key={index} />
            ))}
          </div>
        ) : null}
        <ToolCall toolInvocations={toolInvocations} />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      {files ? (
        <div className="mb-1 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <FilePreview file={file} key={index} />
          ))}
        </div>
      ) : null}
      <div className={cn(chatBubbleVariants({ isUser, animation }))}>
        <MarkdownRenderer>{content}</MarkdownRenderer>
        {actions ? (
          <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      {showTimeStamp && createdAt ? (
        <time
          dateTime={createdAt.toISOString()}
          className={cn(
            "mt-1 block px-1 text-xs opacity-50",
            animation !== "none" && "duration-500 animate-in fade-in-0"
          )}
        >
          {formattedTime}
        </time>
      ) : null}
    </div>
  )
}

function dataUrlToUint8Array(data: string) {
  const base64 = data.split(",")[1]
  // Browser-safe base64 decode without Node Buffer
  try {
    const binary = atob(base64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    return new Uint8Array()
  }
}

const ReasoningBlock = ({ part }: { part: ReasoningPart }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-2 flex flex-col items-start sm:max-w-[70%]">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group w-full overflow-hidden rounded-lg border bg-muted/50"
      >
        <div className="flex items-center p-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span>Thinking</span>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent forceMount>
          <motion.div
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t"
          >
            <div className="p-2">
              <div className="whitespace-pre-wrap text-xs">
                {part.reasoning}
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function ToolCall({
  toolInvocations,
}: Pick<ChatMessageProps, "toolInvocations">) {
  if (!toolInvocations?.length) return null

  return (
    <div className="flex flex-col items-start gap-2">
      {toolInvocations.map((invocation, index) => {
        const isCancelled =
          invocation.state === "result" &&
          invocation.result.__cancelled === true

        return (
          <MCPToolCallBlock
            key={index}
            status={
              isCancelled
                ? "complete"
                : invocation.state === "result"
                ? "complete"
                : "executing"
            }
            name={invocation.toolName}
            args={"args" in invocation ? (invocation as any).args : undefined}
            result={invocation.state === "result" ? (invocation as any).result : undefined}
          />
        )
      })}
    </div>
  )
}

function MCPToolCallBlock({
  status,
  name = "",
  args,
  result,
}: {
  status: "complete" | "inProgress" | "executing"
  name?: string
  args?: any
  result?: any
}) {
  const [isOpen, setIsOpen] = useState(false)

  const dotClass =
    status === "complete"
      ? "bg-muted-foreground"
      : status === "inProgress" || status === "executing"
      ? "bg-muted-foreground animate-pulse"
      : "bg-muted"

  return (
    <div className="w-full sm:max-w-[70%] rounded-lg border bg-muted/50 text-sm text-foreground">
      <div
        className="flex cursor-pointer items-center gap-2 p-2"
        onClick={() => setIsOpen((v) => !v)}
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
        <span className="truncate">{name || "MCP Tool Call"}</span>
        <div className="ml-auto h-2 w-2 rounded-full" role="status" aria-label={status}>
          <div className={cn("h-2 w-2 rounded-full", dotClass)} />
        </div>
      </div>
      {isOpen && (
        <div className="px-3 pb-3">
          {args !== undefined && (
            <div className="mb-2">
              <div className="mb-1 text-xs text-muted-foreground">Parameters:</div>
              <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap text-xs">
                {formatContent(args)}
              </pre>
            </div>
          )}

          {status === "complete" && (
            hasContent(result) ? (
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Result:</div>
                <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap text-xs">
                  {formatContent(result)}
                </pre>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Done.</div>
            )
          )}
        </div>
      )}
    </div>
  )
}

function formatContent(content: any): string {
  if (content == null) return ""
  const text = typeof content === "object" ? JSON.stringify(content, null, 2) : String(content)
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\"/g, '"')
    .replace(/\\\\/g, "\\")
}

function hasContent(value: any): boolean {
  if (value == null) return false
  if (typeof value === "string") return value.trim().length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}
