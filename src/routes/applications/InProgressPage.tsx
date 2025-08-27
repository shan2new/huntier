import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, Building2, Clock, Plus, Target } from 'lucide-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'

// Human-friendly labels and priority for in-progress stages
const STAGE_LABELS: Record<string, string> = {
  recruiter_outreach: 'Recruiter Outreach',
  self_review: 'Self Review',
  hr_shortlist: 'HR Shortlist',
  manager_shortlist: 'Manager Shortlist',
}

const STAGE_PRIORITY: Record<string, number> = {
  recruiter_outreach: 0,
  self_review: 1,
  hr_shortlist: 2,
  manager_shortlist: 3,
}

const humanize = (s: string) => s.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
// Always use the stage name as the grouping/sorting key to keep priority mapping consistent across apps
const getStageKey = (stage: { id?: string; name: string }) => stage.name.toLowerCase()
const getStageTitle = (stage: { id?: string; name: string }) => {
  const key = getStageKey(stage)
  return STAGE_LABELS[key] || humanize(stage.name)
}

// Responsibility per stage and a simple relative time helper
const STAGE_RESPONSIBILITY: Record<string, 'user' | 'company'> = {
  recruiter_outreach: 'user',
  self_review: 'user',
  hr_shortlist: 'company',
  manager_shortlist: 'company',
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
const needsAction = (app: ApplicationListItem) => {
  const key = getStageKey(app.stage)
  if (STAGE_RESPONSIBILITY[key] !== 'user') return false
  return Date.now() - new Date(app.last_activity_at).getTime() > THREE_DAYS_MS
}

export function InProgressApplicationsPage() {
  const { apiCall } = useApi()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiCall<Array<ApplicationListItem>>(`/v1/applications`)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [apiCall])

  const filtered = useMemo(
    () =>
      apps.filter(
        (a) =>
          // Exclude wishlist everywhere; show only on dedicated Wishlist page
          getStageKey(a.stage) !== 'wishlist' &&
          (a.milestone === 'exploration' || a.milestone === 'screening'),
      ),
    [apps],
  )
  
  // Group in-progress applications by their current stage (preserve first-seen order)
  const stageGroups = useMemo(() => {
    const map = new Map<string, { title: string; items: Array<ApplicationListItem> }>()
    for (const app of filtered) {
      const key = getStageKey(app.stage)
      if (!map.has(key)) {
        map.set(key, { title: getStageTitle(app.stage), items: [] })
      }
      map.get(key)!.items.push(app)
    }
    const entries = Array.from(map.entries()).map(([key, value], index) => ({ key, value, index }))
    entries.sort((a, b) => {
      const pa = STAGE_PRIORITY[a.key] ?? 999
      const pb = STAGE_PRIORITY[b.key] ?? 999
      if (pa !== pb) return pa - pb
      return a.index - b.index // stable order for unprioritized stages
    })
    return entries.map(e => e.value)
  }, [filtered])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">In-progress</h2>
            <p className="text-xs text-muted-foreground">Exploration and Screening</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">{filtered.length} apps</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {stageGroups.map((group, gi) => (
            <Card key={`${group.title}-${gi}`} className="shadow-xs">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-4 md:px-6 pt-3 pb-2">
                  <div className="text-xs font-medium text-muted-foreground">{group.title}</div>
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{group.items.length}</Badge>
                </div>
                <div className="divide-y divide-border">
                  {group.items.map((app) => (
                    <div key={app.id} className="group cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10" onClick={() => { setSelectedAppId(app.id); setUpdateModalOpen(true) }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {app.company?.logo_url ? (
                            <img src={app.company.logo_url} alt={app.company.name} className="h-8 w-8 rounded-md border border-border object-cover" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3 className="font-medium text-base truncate">{app.company?.name ?? app.company_id.slice(0, 8)}</h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
                              <span className="truncate">{app.role}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateIndian(app.last_activity_at)}</span>
                              {needsAction(app) ? (
                                <Badge variant="default" className="text-[11px] px-2 py-0.5">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Take action
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No applications yet</div>
          ) : null}
        </div>
      )}

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="fixed bottom-6 right-6 z-40">
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <Button size="icon" className="relative h-14 w-14 rounded-full shadow-lg" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      <CreateApplicationModal open={createModalOpen} onOpenChange={setCreateModalOpen} onCreated={(app: ApplicationListItem) => setApps((prev) => [app, ...prev])} />
      {selectedAppId && (
        <UpdateApplicationModal
          open={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          applicationId={selectedAppId}
          onUpdated={(app: ApplicationListItem) => setApps((prev) => prev.map((a) => (a.id === app.id ? app : a)))}
          onDeleted={(id: string) => setApps((prev) => prev.filter((a) => a.id !== id))}
        />
      )}
    </motion.div>
  )
}

export default InProgressApplicationsPage
