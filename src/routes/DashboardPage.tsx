import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, BarChart3, Building2, CalendarClock, Flame, Layers, MessageSquare, RefreshCw, Sparkles } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import type { FunnelAnalytics, Platform, PlatformAnalyticsItem, QARehearsalResponse } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApi } from '@/lib/use-api'
import { useAuthToken } from '@/lib/auth'
import { clearQARehearsalCacheWithRefresh, generateProfileQARehearsalWithRefresh, getFunnelAnalyticsWithRefresh, getPlatformAnalyticsWithRefresh, listPlatformsWithRefresh } from '@/lib/api'

function StatCard({ title, value, icon: Icon, hint }: { title: string; value: number | string; icon: any; hint?: string }) {
  return (
    <Card className="shadow-xs">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            {hint && <div className="text-[10px] text-muted-foreground/80">{hint}</div>}
          </div>
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FunnelWidget() {
  const [data, setData] = useState<FunnelAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuthToken()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await getFunnelAnalyticsWithRefresh(getToken)
        setData(res)
      } catch {
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const items = useMemo(() => {
    return [
      { key: 'exploration', label: 'Exploration' },
      { key: 'interviewing', label: 'Interviewing' },
      { key: 'post_interview', label: 'Post-interview' },
    ] as Array<{ key: keyof FunnelAnalytics; label: string }>
  }, [])

  return (
    <Card className="shadow-xs h-full w-full">
      <CardContent className="p-4 h-full w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Pipeline funnel</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((i, idx) => (
              <motion.div key={i.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }}>
                <StatCard title={i.label} value={Number(data?.[i.key] ?? 0)} icon={Activity} />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlatformPerformanceWidget() {
  const [rows, setRows] = useState<Array<PlatformAnalyticsItem>>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuthToken()
  const [platforms, setPlatforms] = useState<Array<Platform>>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [analytics, plats] = await Promise.all([
          getPlatformAnalyticsWithRefresh(getToken),
          listPlatformsWithRefresh<Array<Platform>>(getToken),
        ])
        setRows(analytics)
        setPlatforms(Array.isArray(plats) ? plats : [])
      } catch {
        setRows([])
        setPlatforms([])
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const idToPlatform = useMemo(() => {
    const map: Partial<Record<string, Platform>> = {}
    platforms.forEach((p) => { map[p.id] = p })
    return map
  }, [platforms])

  return (
    <Card className="shadow-xs h-full w-full">
      <CardContent className="p-4 h-full w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Platforms performance</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6">No data available</div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
            {rows.map((r, index) => {
              const p = idToPlatform[r.platform_id]
              const name = r.platform_id === 'unassigned' ? 'Unassigned' : (p?.name || r.platform_id.slice(0, 8))
              const logo = p?.logo_url || null
              return (
                <motion.div
                  key={r.platform_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {logo ? (
                      <img src={logo} alt={name} className="h-4 w-4 rounded-sm border border-border object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="text-sm font-medium truncate">{name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="px-2 py-0.5">{r.totals} total</Badge>
                    <Badge variant="outline" className="px-2 py-0.5">{r.in_progress} in-progress</Badge>
                    <Badge variant="outline" className="px-2 py-0.5">{r.offers} offers</Badge>
                  </div>
                </motion.div>
              )
            })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StaleApplicationsWidget() {
  const [items, setItems] = useState<Array<{ id: string; stage: string; time_in_stage_days: number }>>([])
  const [loading, setLoading] = useState(true)
  const { apiCall } = useApi()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        // Use existing list endpoint to compute stale apps without inventing new API
        const apps = await apiCall<Array<any>>('/v1/applications')
        const now = Date.now()
        const mapped = apps
          .map((a) => ({ id: a.id, stage: (a.stage?.id || a.stage) as string, time_in_stage_days: Math.floor((now - new Date(a.last_activity_at).getTime()) / 86400000) }))
          .filter((x) => x.time_in_stage_days > 7)
          .sort((a, b) => b.time_in_stage_days - a.time_in_stage_days)
          .slice(0, 8)
        setItems(mapped)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [apiCall])

  return (
    <Card className="shadow-xs h-full w-full">
      <CardContent className="p-4 h-full w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Stale applications</div>
              <div className="text-xs text-muted-foreground">No activity for 7+ days</div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">{items.length}</Badge>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6">Looks good—no stale items.</div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
            {items.map((it, index) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <div className="text-xs truncate">{it.id.slice(0, 8)} • {it.stage}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3 w-3 text-amber-500" />
                  <span>{it.time_in_stage_days} days</span>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QARehearsalWidget() {
  const { getToken } = useAuthToken()
  const [rehearsal, setRehearsal] = useState<QARehearsalResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRehearsal = async (clearCache = false) => {
    try {
      if (clearCache) {
        await clearQARehearsalCacheWithRefresh(getToken)
      }
      const response = await generateProfileQARehearsalWithRefresh(getToken)
      setRehearsal(response)
    } catch {
      setRehearsal(null)
    }
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await fetchRehearsal()
      setLoading(false)
    })()
  }, [getToken])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRehearsal(true) // Clear cache and regenerate
    setRefreshing(false)
  }

  return (
    <Card className="shadow-xs">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium">Q&A Rehearsal</div>
              <div className="text-xs text-muted-foreground">Interview-ready responses</div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-50"
            title="Refresh AI responses"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !rehearsal ? (
          <div className="text-xs text-muted-foreground py-6">Add QA responses in Profile settings to get interview-ready answers.</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {rehearsal.pitch && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1">20-second pitch</div>
                  <div className="text-sm">{rehearsal.pitch}</div>
                </motion.div>
              )}
              {Object.entries(rehearsal.responses).map(([key, response], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                  className="rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm">{response}</div>
                </motion.div>
              ))}
              {rehearsal.note && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="text-xs text-muted-foreground mt-2"
                >
                  {rehearsal.note}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// RoleSuggestionsWidget removed (unused)

export function DashboardPage() {
  const { user } = useUser()
  const firstName = user?.firstName || ''
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto pt-8 space-y-3">
      {/* Top row: Welcome (prominent) + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }} className="flex">
          <Card className="shadow-xs h-full flex-1">
            <CardContent className="p-4 h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="text-lg font-semibold tracking-tight">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</div>
                  <div className="text-xs text-muted-foreground">Quick insights for your job hunt</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }} className="flex">
          <FunnelWidget />
        </motion.div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }} className="flex">
          <StaleApplicationsWidget />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }} className="flex">
          <PlatformPerformanceWidget />
        </motion.div>
      </div>

      {/* Intelligence row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch auto-rows-fr">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }} className="flex">
          <QARehearsalWidget />
        </motion.div>
        {/* <RoleSuggestionsWidget /> */}
      </div>
    </motion.div>
  )
}

export default DashboardPage


