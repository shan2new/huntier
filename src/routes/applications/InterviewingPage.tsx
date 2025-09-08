import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, Building2, Calendar, Clock, MoreVertical, Plus } from 'lucide-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EntityListItem } from '@/components/lists/EntityListItem'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'
import { FloatingActionButton } from '@/components/lists/FloatingActionButton'

export function InterviewingApplicationsPage() {
  const { apiCall } = useApi()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

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

  const filtered = useMemo(() => apps.filter(a => a.milestone === 'interviewing'), [apps])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto pt-8 max-w-[1100px] md:max-w-[900px] lg:max-w-[1024px] xl:max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Interviewing</h2>
            <p className="text-xs text-muted-foreground">All interview rounds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setSelected(new Set()) }}>Cancel</Button>
              <Button size="sm" variant="secondary" disabled={selected.size===0}>Archive</Button>
              <Button size="sm" variant="destructive" disabled={selected.size===0}>Delete</Button>
            </>
          )}
          <Badge variant="secondary" className="text-xs">{filtered.length} apps</Badge>
        </div>
      </div>

      <Card className="shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <AnimatePresence>
              <ScrollArea className="h-[calc(100vh-150px)]">
                <div className="divide-y divide-border">
                  {filtered.map((app, index) => (
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
                          <span>•</span>
                          <Badge variant="outline" className="text-[11px] px-2 py-0.5">{app.stage.name}</Badge>
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
                              <DropdownMenuItem>
                                <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null
                      }
                    />
                  ))}
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">No applications yet</div>
                  ) : null}
                </div>
              </ScrollArea>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

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

export default InterviewingApplicationsPage
