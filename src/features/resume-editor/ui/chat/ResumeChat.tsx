import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCopilotAdditionalInstructions, useCopilotChat } from '@copilotkit/react-core'
import { ActionExecutionMessage, ImageMessage, MessageRole, ResultMessage, TextMessage } from '@copilotkit/runtime-client-gql'
import { Chat } from '@/components/ui/chat'
import type { Message as KitMessage } from '@/components/ui/chat-message'

type Labels = {
  title?: string
  initial?: string
}

export function ResumeChat({ className, instructions }: { className?: string, instructions?: string, labels?: Labels }) {
  const { isLoading, visibleMessages, appendMessage, stopGeneration, setMcpServers } = useCopilotChat({ id: 'resume-chat' })
  useCopilotAdditionalInstructions({ instructions: instructions || '' }, [])

  // Configure MCP servers if provided globally (aligns with CopilotKit MCP docs)
  useEffect(() => {
    try {
      const servers = (window as any)?.__MCP_SERVERS
      if (Array.isArray(servers) && servers.length > 0) {
        setMcpServers(servers)
      }
    } catch {}
  }, [setMcpServers])

  const [input, setInput] = useState('')

  const mappedMessages: KitMessage[] = useMemo(() => {
    const msgs = (visibleMessages || []) as any[]
    const out: KitMessage[] = []
    const toolIndexByActionId = new Map<string, number>()
    let pendingUserAttachments: Array<{ url: string; contentType?: string }> = []
    let lastImageId: string | null = null

    const flushUserAttachments = () => {
      if (pendingUserAttachments.length > 0) {
        out.push({
          id: lastImageId || `att-${Math.random()}`,
          role: 'user',
          content: '',
          experimental_attachments: pendingUserAttachments,
        })
        pendingUserAttachments = []
        lastImageId = null
      }
    }

    for (const m of msgs) {
      // User/Assistant text
      if (typeof m?.isTextMessage === 'function' && m.isTextMessage()) {
        const isUser = m.role === MessageRole.User
        if (isUser) {
          const content = m.content || ''
          if (pendingUserAttachments.length > 0) {
            // Combine attachments + text into single message
            out.push({
              id: m.id,
              role: 'user',
              content,
              experimental_attachments: pendingUserAttachments,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            })
            pendingUserAttachments = []
            lastImageId = null
          } else {
            out.push({ id: m.id, role: 'user', content, createdAt: m.createdAt ? new Date(m.createdAt) : undefined })
          }
          continue
        }
        // Assistant text: skip placeholder empty message used by CopilotKit while thinking
        flushUserAttachments()
        const content = (m.content || '').trim()
        if (content.length === 0) {
          continue
        }
        out.push({ id: m.id, role: 'assistant', content, createdAt: m.createdAt ? new Date(m.createdAt) : undefined })
        continue
      }

      // Image messages
      if (typeof m?.isImageMessage === 'function' && m.isImageMessage()) {
        const role = m.role === MessageRole.User ? 'user' : 'assistant'
        const url = `data:image/${m.format};base64,${m.bytes}`
        if (role === 'user') {
          pendingUserAttachments.push({ url, contentType: `image/${m.format}` })
          lastImageId = m.id
        } else {
          flushUserAttachments()
          out.push({ id: m.id, role, content: '', createdAt: m.createdAt ? new Date(m.createdAt) : undefined, experimental_attachments: [{ url, contentType: `image/${m.format}` }] })
        }
        continue
      }

      // Tool calls
      if (typeof m?.isActionExecutionMessage === 'function' && m.isActionExecutionMessage()) {
        flushUserAttachments()
        const idx = out.length
        const rawArgs: any = (m as ActionExecutionMessage).arguments as any
        const args = (() => {
          try {
            if (Array.isArray(rawArgs)) {
              const joined = rawArgs.join('')
              return JSON.parse(joined)
            }
            if (typeof rawArgs === 'string') {
              return JSON.parse(rawArgs)
            }
            return rawArgs
          } catch {
            return rawArgs
          }
        })()
        out.push({ id: m.id, role: 'assistant', content: '', toolInvocations: [{ state: 'call', toolName: (m as ActionExecutionMessage).name, args }] })
        toolIndexByActionId.set((m as any).id, idx)
        continue
      }

      if (typeof m?.isResultMessage === 'function' && m.isResultMessage()) {
        flushUserAttachments()
        let parsed: any = (m as ResultMessage).result
        try {
          parsed = ResultMessage.decodeResult((m as ResultMessage).result)
        } catch {}
        const actionId = (m as ResultMessage).actionExecutionId as unknown as string
        const existingIdx = toolIndexByActionId.get(actionId)
        if (existingIdx !== undefined) {
          const prev = (out[existingIdx].toolInvocations || [])[0] as any
          out[existingIdx] = {
            ...out[existingIdx],
            toolInvocations: [{ state: 'result', toolName: (m as ResultMessage).actionName, result: parsed, args: prev?.args }],
          }
        } else {
          out.push({ id: m.id, role: 'assistant', content: '', toolInvocations: [{ state: 'result', toolName: (m as ResultMessage).actionName, result: parsed }] })
        }
        continue
      }
    }

    // Flush any remaining user attachments without trailing text
    flushUserAttachments()
    return out
  }, [visibleMessages])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => {
    event?.preventDefault?.()
    // Clear input immediately for snappy UX
    const text = input.trim()
    setInput('')
    const files = options?.experimental_attachments
    const list = files ? Array.from(files).filter((f) => f.type.startsWith('image/')) : []
    // Strategy: append all images first without triggering follow-up, then append text once (or trigger on last image if no text)
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        const f = list[i]
        const dataUrl = await readAsDataURL(f)
        const [, base64] = dataUrl.split(',')
        const format = (f.type.replace('image/', '') || 'png').toLowerCase()
        const isLastImage = i === list.length - 1
        const shouldTrigger = isLastImage && text.length === 0
        await appendMessage(new ImageMessage({ role: MessageRole.User, format, bytes: base64 }) as any, { followUp: !shouldTrigger })
      }
    }
    if (text.length > 0) {
      // Now append the text once, as the final piece to trigger generation
      await appendMessage(new TextMessage({ role: MessageRole.User, content: text }) as any)
    }
  }, [appendMessage, input])

  return (
    <Chat
      className={className}
      messages={mappedMessages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isGenerating={isLoading}
      stop={stopGeneration}
    />
  )
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

export default ResumeChat


