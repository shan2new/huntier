
import * as React from "react"
import { Loader2, RefreshCcw, Search } from "lucide-react"

import { useMail } from "../use-mail"
import { MailDisplay } from "./mail-display"
import { MailList } from "./mail-list"
import type { Mail } from "../data"
import type { MailThread } from "@/lib/api"

import { Input } from "@/components/ui/input"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthToken } from "@/lib/auth"
import { getMailStatusWithRefresh, listMailThreadsWithRefresh } from "@/lib/api"

interface MailProps {
  accounts: Array<{
    label: string
    email: string
    icon: React.ReactNode}>
  mails: Array<Mail>
  defaultLayout: Array<number> | undefined
  navCollapsedSize: number
}

export function Mail({
  mails,
  defaultLayout = [30, 60],
}: MailProps) {
  const [mail] = useMail()
  const { getToken } = useAuthToken()

  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [needsScope, setNeedsScope] = React.useState<null | { missing: Array<string> }>(null)
  const [threads, setThreads] = React.useState<Array<MailThread>>([])

  const loadData = React.useCallback(async () => {
    setError(null)
    setNeedsScope(null)
    setLoading(true)
    try {
      const status = await getMailStatusWithRefresh(getToken)
      if (!status.hasGoogleLinked || status.needsAuth || status.hasRequiredScopes === false) {
        setNeedsScope({ missing: status.missingScopes || status.requiredScopes || ["https://www.googleapis.com/auth/gmail.readonly"] })
        setThreads([])
      } else {
        const th = await listMailThreadsWithRefresh(getToken)
        setThreads(th)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load mail")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    // keep spinner visible a touch for UX
    setTimeout(() => setRefreshing(false), 300)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: Array<number>) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-full max-h-[900px] items-stretch bg-card border border-border rounded-lg"
      >
        <ResizablePanel defaultSize={defaultLayout[0]} minSize={30} className="border-r border-border">
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-lg font-bold">SuperMail</h1>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-2">
                <form className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search" className="pl-8" />
                  </div>
                </form>
                <Button variant="ghost" size="icon" onClick={onRefresh} aria-label="Refresh" title="Refresh">
                  {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                </Button>
              </div>
            </div>
            <TabsContent value="all" className="m-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : error ? (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertTitle>Failed to load mail</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : needsScope ? (
                <div className="p-4">
                  <Alert>
                    <AlertTitle>Gmail permissions needed</AlertTitle>
                    <AlertDescription>
                      Missing scopes: {needsScope.missing.join(", ")}. Please re-connect Google in settings with the required permissions.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <MailList
                  items={threads.map((t) => ({
                    id: t.id,
                    name: t.preview_from?.value || t.preview_from?.name || "",
                    email: t.preview_from?.email || "",
                    subject: t.subject || "(no subject)",
                    text: t.snippet || "",
                    date: t.latest_at,
                    read: (t as any).unread_count ? (t as any).unread_count === 0 : true,
                    labels: Array.isArray((t as any).label_ids) ? (t as any).label_ids : [],
                  }))}
                />
              )}
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.read)} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        {/* <ResizableHandle/> */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="border-border">
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}