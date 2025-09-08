import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Archive, Building2, Clock, Plus, Target } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'
import { bulkUpdateApplicationsWithRefresh, patchApplicationWithRefresh } from '@/lib/api'

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
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { getToken } = useAuth()

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto pt-8 max-w-[1100px] md:max-w-[900px] lg:max-w-[1024px] xl:max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Screening</h2>
            <p className="text-xs text-muted-foreground">Exploration & Screening</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setSelected(new Set()) }}>Cancel</Button>
              <Button 
                size="sm" 
                variant="secondary" 
                disabled={selected.size===0}
                onClick={async () => {
                  if (!selected.size) return
                  const ids = Array.from(selected)
                  await bulkUpdateApplicationsWithRefresh(async () => (await getToken()) || '', { ids, action: 'archive' })
                  setApps(prev => prev.filter(a => !ids.includes(a.id)))
                  setSelected(new Set())
                  setEditMode(false)
                }}
              >
                Archive
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                disabled={selected.size===0}
                onClick={async () => {
                  if (!selected.size) return
                  const ids = Array.from(selected)
                  await bulkUpdateApplicationsWithRefresh(async () => (await getToken()) || '', { ids, action: 'delete' })
                  setApps(prev => prev.filter(a => !ids.includes(a.id)))
                  setSelected(new Set())
                  setEditMode(false)
                }}
              >
                Delete
              </Button>
            </>
          )}
          <Badge variant="secondary" className="text-xs">{filtered.length} apps</Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-150px)]">
          <div className="space-y-8">
            <AnimatePresence>
              {stageGroups.map((group, gi) => (
                <motion.div
                  key={`${group.title}-${gi}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: 0.2 + gi * 0.05, ease: 'easeOut' }}
                >
                  <div className="flex items-center justify-between pt-3 pb-2">
                    <div className="text-xs font-medium text-muted-foreground">{group.title}</div>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">{group.items.length}</Badge>
                  </div>
                  <Card className="shadow-xs">
                    <CardContent className="p-0">
                      <AnimatePresence>
                        <div className="divide-y divide-border">
                          {group.items.map((app, index) => (
                            <motion.div
                              key={app.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                              className="group cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10 relative"
                              onClick={() => {
                                if (editMode) {
                                  const next = new Set(selected)
                                  if (next.has(app.id)) next.delete(app.id); else next.add(app.id)
                                  setSelected(next)
                                  return
                                }
                                setSelectedAppId(app.id); setUpdateModalOpen(true)
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  {editMode && (
                                    <Checkbox
                                      checked={selected.has(app.id)}
                                      onCheckedChange={() => {
                                        const next = new Set(selected)
                                        if (next.has(app.id)) next.delete(app.id); else next.add(app.id)
                                        setSelected(next)
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-4 w-4 mr-1"
                                    />
                                  )}
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
                                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateIndian((app as any).progress_updated_at || app.last_activity_at)}</span>
                                      {needsAction(app) ? (
                                        <Badge variant="default" className="text-[11px] px-2 py-0.5">
                                          <AlertCircle className="h-3 w-3 mr-1" />
                                          Take action
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!editMode && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md border border-transparent hover:border-border">Actions</button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            await patchApplicationWithRefresh(async () => (await getToken()) || '', app.id, { is_archived: true })
                                            setApps(prev => prev.filter(a => a.id !== app.id))
                                          }}
                                        >
                                          <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No applications yet</div>
            ) : null}
          </div>
        </ScrollArea>
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
