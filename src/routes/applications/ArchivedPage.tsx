import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, Building2, Clock, RotateCcw, Trash2 } from 'lucide-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@clerk/clerk-react'
import { bulkUpdateApplicationsWithRefresh, patchApplicationWithRefresh } from '@/lib/api'

export function ArchivedApplicationsPage() {
  const { apiCall } = useApi()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [loading, setLoading] = useState(true)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const { getToken } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiCall<Array<ApplicationListItem>>(`/v1/applications?is_archived=true`)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [apiCall])

  const filtered = useMemo(() => apps, [apps])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto pt-8 max-w-[1100px] md:max-w-[900px] lg:max-w-[1024px] xl-max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Archive className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Archived</h2>
            <p className="text-xs text-muted-foreground">Hidden from active views</p>
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
                disabled={selected.size === 0}
                onClick={async () => {
                  const ids = Array.from(selected)
                  await bulkUpdateApplicationsWithRefresh(async () => (await getToken()) || '', { ids, action: 'unarchive' })
                  setApps(prev => prev.filter(a => !ids.includes(a.id)))
                  setSelected(new Set())
                  setEditMode(false)
                }}
              >
                Unarchive
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={selected.size === 0}
                onClick={async () => {
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
                                    await patchApplicationWithRefresh(async () => (await getToken()) || '', app.id, { is_archived: false })
                                    setApps(prev => prev.filter(a => a.id !== app.id))
                                  }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-2" /> Unarchive
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await bulkUpdateApplicationsWithRefresh(async () => (await getToken()) || '', { ids: [app.id], action: 'delete' })
                                    setApps(prev => prev.filter(a => a.id !== app.id))
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">No archived applications</div>
                  ) : null}
                </div>
              </ScrollArea>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

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

export default ArchivedApplicationsPage


