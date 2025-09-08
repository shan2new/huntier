import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Archive, Building2, Clock, MoreVertical, Plus, Target } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
//
import { ListSection } from '@/components/lists/ListSection'
import { EntityListItem } from '@/components/lists/EntityListItem'
import { FloatingActionButton } from '@/components/lists/FloatingActionButton'
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
                <ListSection key={`${group.title}-${gi}`} title={group.title} count={group.items.length}>
                  <AnimatePresence>
                    <div className="divide-y divide-border">
                      {group.items.map((app, index) => (
                        <EntityListItem
                          key={app.id}
                          id={app.id}
                          index={index}
                          selectable={editMode}
                          selected={selected.has(app.id)}
                          onSelectToggle={(id) => {
                            const next = new Set(selected)
                            if (next.has(id)) next.delete(id); else next.add(id)
                            setSelected(next)
                          }}
                          onClick={() => {
                            if (editMode) return
                            setSelectedAppId(app.id); setUpdateModalOpen(true)
                          }}
                          leading={app.company?.logo_url ? (
                            <img src={app.company.logo_url} alt={app.company.name} className="h-8 w-8 rounded-md border border-border object-cover" />
                          ) : (
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          )}
                          title={<>{app.company?.name ?? app.company_id.slice(0, 8)}</>}
                          subtitle={
                            <>
                              <span className="truncate">{app.role}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateIndian((app as any).progress_updated_at || app.last_activity_at)}</span>
                              {needsAction(app) ? (
                                <Badge variant="default" className="text-[11px] px-2 py-0.5 ml-1">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Take action
                                </Badge>
                              ) : null}
                            </>
                          }
                          actions={
                            !editMode ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
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
                            ) : null
                          }
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                </ListSection>
              ))}
            </AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No applications yet</div>
            ) : null}
          </div>
        </ScrollArea>
      )}

      <FloatingActionButton onClick={() => setCreateModalOpen(true)} icon={<Plus className="h-6 w-6" />} ariaLabel="Create application" />

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
