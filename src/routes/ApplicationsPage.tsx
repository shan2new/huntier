import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, Award, Building2, ChevronRight, Clock, ExternalLink, Gift, Handshake, Phone, Plus, Search, Telescope, UserPlus, Users, Archive } from 'lucide-react'
import { useApi } from '../lib/use-api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useAuth } from '@clerk/clerk-react'
import { patchApplicationWithRefresh } from '@/lib/api'

// Helper function to format salary information
function formatSalary(compensation: any) {
  if (!compensation) return null
  
  const fixed = compensation.fixed_min_lpa || compensation.fixed_max_lpa
  const variable = compensation.var_min_lpa || compensation.var_max_lpa
  
  if (!fixed && !variable) return null
  
  // Clean up decimal places - remove .00 if value ends with .00
  const formatValue = (val: string) => {
    if (!val || val === 'N/A') return val
    return val.endsWith('.00') ? val.slice(0, -3) : val
  }
  
  // If it's a fixed amount (min === max)
  if (fixed && compensation.fixed_min_lpa === compensation.fixed_max_lpa) {
    const amount = formatValue(compensation.fixed_min_lpa)
    return `₹${amount} LPA`
  }
  
  // If it's a range
  if (fixed) {
    const min = formatValue(compensation.fixed_min_lpa)
    const max = formatValue(compensation.fixed_max_lpa)
    return `₹${min}-${max} LPA`
  }
  
  // If it's variable only
  if (variable) {
    const amount = formatValue(compensation.var_min_lpa || compensation.var_max_lpa)
    return `₹${amount} LPA (Variable)`
  }
  
  return null
}


const milestoneConfig: Partial<Record<string, { label: string; icon: any }>> = {
  exploration: { label: 'Exploration', icon: Telescope },
  screening: { label: 'Screening', icon: Search },
  interviewing: { label: 'Interviewing', icon: Users },
  post_interview: { label: 'Offer', icon: Gift },
}

const sourceConfig: Partial<Record<string, { icon: any; label: string }>> = {
  applied_self: { icon: UserPlus, label: 'Self Applied' },
  applied_referral: { icon: Handshake, label: 'Referral' },
  recruiter_outreach: { icon: Phone, label: 'Recruiter' },
}

export function ApplicationsPage() {
  const { getToken } = useAuth()
  const { apiCall } = useApi()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])  
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const search = new URLSearchParams(globalThis.location.search).get('search') || ''

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const qs = params.toString()
        const data = await apiCall<Array<ApplicationListItem>>(`/v1/applications${qs ? `?${qs}` : ''}`)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [search, apiCall])
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const pipelineGroups = useMemo(() => {
    const inProgress = apps.filter(
      (app) => app.milestone === 'exploration' || app.milestone === 'screening'
    )
    const interviewing = apps.filter((app) => app.milestone === 'interviewing')
    const completed = apps.filter((app) => app.milestone === 'post_interview')
    const wishlist = apps.filter((app) => app.milestone === 'exploration' && app.stage.name.toLowerCase() === 'wishlist')
    return [
      { key: 'wishlist', title: 'Wishlist', icon: Telescope, items: wishlist },
      { key: 'in_progress', title: 'Screening', icon: Activity, items: inProgress },
      { key: 'interviewing', title: 'Interviewing', icon: Users, items: interviewing },
      { key: 'completed', title: 'Completed', icon: Award, items: completed },
    ] as Array<{ key: string; title: string; icon: any; items: Array<ApplicationListItem> }>
  }, [apps])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative space-y-8 h-full"
    >
      <div className="mx-auto pt-8 max-w-6xl">

      {/* Pipeline lanes: Screening → Interviewing → Completed */}
      <motion.div
        className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        {pipelineGroups.map((group, idx) => (
          <motion.div
            key={group.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
          >
            <Card className="relative overflow-hidden border border-border shadow-xs bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <group.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.title}</p>
                      <p className="text-xs text-muted-foreground">{group.items.length} apps</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editMode ? (
                      <Button size="sm" variant="outline" className="h-7" onClick={() => setEditMode(true)}>Edit</Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="h-7" onClick={() => { setEditMode(false); setSelected(new Set()) }}>Cancel</Button>
                        <Button size="sm" variant="secondary" className="h-7" disabled={selected.size===0}>Archive</Button>
                        <Button size="sm" variant="destructive" className="h-7" disabled={selected.size===0}>Delete</Button>
                      </>
                    )}
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">{group.items.length}</Badge>
                  </div>
                </div>
                {/* Removed inline application previews from summary cards for a cleaner overview */}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Applications Grid - Sectioned by milestones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      >
        <ScrollArea className="h-[calc(100vh-150px)] px-2">
          {(['wishlist','in_progress','interviewing','completed'] as const).map((laneKey) => {
            const group = pipelineGroups.find(g => g.key === laneKey)
            if (!group || group.items.length === 0) return null
            return (
              <div key={group.key} className="mb-6">
                <div className="flex items-center justify-between px-2 md:px-0 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <group.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{group.title}</h3>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5">{group.items.length}</Badge>
                </div>
                <Card className="shadow-xs">
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"
                        />
                      </div>
                    ) : (
                      <AnimatePresence>
                        <div className="divide-y divide-border">
                          {group.items.map((app, index) => (
                            <motion.div
                              key={app.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, transition: { duration: 0.2 } }}
                              transition={{ 
                                duration: 0.3, 
                                delay: index * 0.05, 
                                ease: "easeOut"
                              }}
                              className="group"
                            >
                              <div 
                                className="cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10 relative"
                                onClick={() => {
                                  if (editMode) {
                                    const next = new Set(selected)
                                    if (next.has(app.id)) next.delete(app.id); else next.add(app.id)
                                    setSelected(next)
                                    return
                                  }
                                  setSelectedAppId(app.id)
                                  setUpdateModalOpen(true)
                                }}
                              >
                                <div>
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1 space-y-2 min-w-0">
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                          {editMode && (
                                            <Checkbox
                                              checked={selected.has(app.id)}
                                              onCheckedChange={() => {
                                                const next = new Set(selected)
                                                if (next.has(app.id)) next.delete(app.id); else next.add(app.id)
                                                setSelected(next)
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                              className="h-4 w-4"
                                            />
                                          )}
                                          {app.company?.logo_url ? (
                                            <img
                                              src={app.company.logo_url}
                                              alt={app.company.name}
                                              className="h-8 w-8 rounded-md border border-border object-cover"
                                            />
                                          ) : (
                                            <Building2 className="h-8 w-8 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center space-x-2 min-w-0">
                                            <h3 className="font-medium text-base text-foreground group-hover:text-primary transition-colors truncate">
                                              {app.company?.name ?? `Company ${app.company_id.slice(0, 8)}...`}
                                            </h3>
                                            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                          </div>
                                          <div className="flex items-center space-x-3 text-xs text-muted-foreground min-w-0">
                                            <span className="truncate">{app.role}</span>
                                            {formatSalary(app.compensation) && (
                                              <>
                                                <span>•</span>
                                                <span className="truncate">{formatSalary(app.compensation)}</span>
                                              </>
                                            )}
                                            {app.platform && (
                                              <>
                                                <span>•</span>
                                                <span className="flex items-center space-x-1">
                                                  {app.platform.logo_url ? (
                                                    <img
                                                      src={app.platform.logo_url}
                                                      alt={app.platform.name}
                                                      className="h-4 w-4 rounded-sm border border-border object-cover"
                                                    />
                                                  ) : (
                                                    <Building2 className="h-4 w-4" />
                                                  )}
                                                  <span className="truncate max-w-[10rem]">{app.platform.name}</span>
                                                </span>
                                              </>
                                            )}
                                            <span>•</span>
                                            <span className="flex items-center space-x-1">
                                              <Clock className="h-3 w-3" />
                                              <span>{formatDateIndian(((app as any).progress_updated_at || app.last_activity_at))}</span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2.5 sm:self-start sm:justify-end">
                                      <div className="flex items-center space-x-1.5 whitespace-nowrap">
                                        <Badge className="text-xs font-medium px-2 py-0.5 bg-secondary text-secondary-foreground">
                                          {sourceConfig[app.source]?.label}
                                        </Badge>
                                        <Badge className="text-xs font-medium px-2 py-0.5" variant="outline">
                                          <div className="flex items-center gap-1.5">
                                            {(() => {
                                              const config = milestoneConfig[app.milestone]
                                              if (config) {
                                                const IconComponent = config.icon
                                                return <IconComponent className="h-3.5 w-3.5" />
                                              }
                                              return null
                                            })()}
                                            <span>{app.stage.name}</span>
                                          </div>
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md border border-transparent hover:border-border">Actions</button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  const tokenFn = async () => (await getToken()) || ''
                                                  await patchApplicationWithRefresh(tokenFn, app.id, { is_archived: true })
                                                  setApps(prev => prev.filter(a => a.id !== app.id))
                                                  toast.success('Archived application')
                                                } catch (err) {
                                                  toast.error('Failed to archive')
                                                }
                                              }}
                                            >
                                              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}

          {!loading && apps.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center py-12"
            >
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No applications yet</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Start your job hunt journey by adding your first application. Track your progress and land your dream job!
                </p>
              </div>
            </motion.div>
          )}
        </ScrollArea>
      </motion.div>

      </div>

      {/* Create Application Modal */}
      <CreateApplicationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={(app: ApplicationListItem) => setApps((prev) => [app, ...prev])}
      />

      {/* Update Application Modal */}
      {selectedAppId && (
        <UpdateApplicationModal
          open={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          applicationId={selectedAppId}
          onUpdated={(app: ApplicationListItem) => setApps((prev) => prev.map((a) => (a.id === app.id ? app : a)))}
          onDeleted={(id: string) => setApps((prev) => prev.filter((a) => a.id !== id))}
        />
      )}

      {/* Floating Add Button (FAB) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute bottom-6 right-6 z-40"
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <Button
          size="icon"
          className="relative h-14 w-14 rounded-full shadow-lg"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </motion.div>
  )
}




