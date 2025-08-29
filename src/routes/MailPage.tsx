import { useEffect, useState } from 'react'
import { useAuthToken } from '@/lib/auth'
import { listMailThreadsWithRefresh, listMailMessagesWithRefresh, getMailStatusWithRefresh, updateMailScopesWithRefresh, type MailThread, type MailMessage, type MailQueueStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function MailPage() {
  const { getToken } = useAuthToken()
  const [threads, setThreads] = useState<Array<MailThread> | null>(null)
  const [active, setActive] = useState<MailThread | null>(null)
  const [messages, setMessages] = useState<Array<MailMessage> | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [status, setStatus] = useState<MailQueueStatus | null>(null)
  const [sendEnabled, setSendEnabled] = useState(false)

  useEffect(() => {
    let mounted = true
    let justEnqueuedTimer: any
    ;(async () => {
      try {
        const items = await listMailThreadsWithRefresh(getToken, {})
        if (!mounted) return
        setThreads(items)
        if (items?.length) setActive(items[0])
        // optimistic syncing indicator right after load (backend enqueues on list)
        setIsSyncing(true)
        justEnqueuedTimer = setTimeout(() => setIsSyncing(false), 8000)
      } catch {
        setThreads([])
      }
    })()
    return () => { mounted = false; if (justEnqueuedTimer) clearTimeout(justEnqueuedTimer) }
  }, [getToken])

  useEffect(() => {
    if (!active) return
    setLoadingThread(true)
    ;(async () => {
      try {
        const msgs = await listMailMessagesWithRefresh(getToken, active.id)
        setMessages(msgs)
      } finally {
        setLoadingThread(false)
      }
    })()
  }, [active, getToken])

  useEffect(() => {
    let mounted = true
    let timer: any
    const tick = async () => {
      try {
        const s = await getMailStatusWithRefresh(getToken, {})
        const waiting = (s?.counts?.wait || 0) + (s?.counts?.active || 0)
        if (mounted) {
          setIsSyncing(waiting > 0)
          setStatus(s)
          const required = (s?.requiredScopes || [])
          setSendEnabled(required.includes('https://www.googleapis.com/auth/gmail.send'))
        }
      } catch {}
      timer = setTimeout(tick, 3000)
    }
    tick()
    return () => { mounted = false; if (timer) clearTimeout(timer) }
  }, [getToken])

  return (
    <div className="h-[calc(100vh-4rem)] px-4">
      <Card className="h-full overflow-hidden">
        <div className="h-full flex">
      <div className="w-80 border-r flex flex-col">
        <div className="p-3 flex items-center justify-between">
          <div className="font-medium flex items-center gap-2">Inbox {isSyncing && (<Loader2 className="h-4 w-4 animate-spin" />)}</div>
          {!status?.hasGoogleLinked && (
            <Button size="sm" variant="secondary" onClick={() => { window.location.href = '/auth' }}>Connect Gmail</Button>
          )}
          {status?.hasGoogleLinked && status?.missingScopes && status.missingScopes.length > 0 && (
            <Button size="sm" variant="secondary" onClick={async () => {
              try {
                // Trigger Clerk reauthorization via ReauthProvider paths; here we can hint user
                window.location.reload()
              } catch {}
            }}>Grant Gmail Scopes</Button>
          )}
        </div>
        <div className="px-3 pb-2 flex items-center gap-2">
          <Checkbox
            checked={sendEnabled}
            onCheckedChange={async (checked) => {
              try {
                await updateMailScopesWithRefresh(getToken, { send_enabled: !!checked })
              } catch {}
            }}
          />
          <div className="text-xs text-muted-foreground">Enable sending emails</div>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {threads === null && Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            {threads?.map(t => (
              <Card key={t.id} className={`p-3 cursor-pointer ${active?.id === t.id ? 'ring-1 ring-primary' : ''}`} onClick={() => setActive(t)}>
                <div className="text-sm font-medium line-clamp-1">{t.subject || '(no subject)'}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{t.snippet}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(t.latest_at).toLocaleString()}</div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1">
        {!active && (
          <div className="h-full flex items-center justify-center text-muted-foreground">Select a thread</div>
        )}
        {active && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <div className="text-xl font-semibold">{active.subject || '(no subject)'}</div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {loadingThread && <Skeleton className="h-24 w-full" />}
                {!loadingThread && messages?.map(m => (
                  <Card key={m.id} className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">{new Date(m.internal_date).toLocaleString()}</div>
                    <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap">{m.body_text || m.subject || ''}</div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Button>Reply</Button>
                <Button variant="secondary">Assign</Button>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
      </Card>
    </div>
  )
}


