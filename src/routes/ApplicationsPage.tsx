import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, Award, Building2, ChevronRight, Clock, ExternalLink, Gift, Handshake, Phone, Plus, Search, Telescope, UserPlus, Users } from 'lucide-react'
import { useApi } from '../lib/use-api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'

// Helper function to format salary information
function formatSalary(compensation: any) {
  if (!compensation) return null
  
  const fixed = compensation.fixed_min_lpa || compensation.fixed_max_lpa
  const variable = compensation.var_min_lpa || compensation.var_max_lpa
  
  if (!fixed && !variable) return null
  
  const parts = []
  
  if (fixed) {
    const min = compensation.fixed_min_lpa || 'N/A'
    const max = compensation.fixed_max_lpa || 'N/A'
    // Clean up decimal places - remove .00 if both min and max end with .00
    const formatValue = (val: string) => {
      if (val === 'N/A') return val
      return val.endsWith('.00') ? val.slice(0, -3) : val
    }
    parts.push(`₹${formatValue(min)}-${formatValue(max)} LPA`)
  }
  
  if (variable) {
    const min = compensation.var_min_lpa || 'N/A'
    const max = compensation.var_max_lpa || 'N/A'
    // Clean up decimal places - remove .00 if both min and max end with .00
    const formatValue = (val: string) => {
      if (val === 'N/A') return val
      return val.endsWith('.00') ? val.slice(0, -3) : val
    }
    parts.push(`+₹${formatValue(min)}-${formatValue(max)} variable`)
  }
  
  return parts.join(' ')
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
  const pipelineGroups = useMemo(() => {
    const inProgress = apps.filter(
      (app) => app.milestone === 'exploration' || app.milestone === 'screening'
    )
    const interviewing = apps.filter((app) => app.milestone === 'interviewing')
    const completed = apps.filter((app) => app.milestone === 'post_interview')
    return [
      { key: 'in_progress', title: 'In-progress', icon: Activity, items: inProgress },
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

      {/* Pipeline lanes: In-progress → Interviewing → Completed */}
      <motion.div
        className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-8"
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
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">{group.items.length}</Badge>
                </div>
                <div className="-mx-1 overflow-x-auto">
                  <div className="flex gap-2 px-1 snap-x snap-mandatory">
                    {group.items.length === 0 ? (
                      <div className="w-full text-center text-xs text-muted-foreground py-6">No applications</div>
                    ) : (
                      group.items.map((app) => (
                        <button
                          key={app.id}
                          className="min-w-[220px] max-w-[240px] snap-start rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left p-3"
                          onClick={() => {
                            setSelectedAppId(app.id)
                            setUpdateModalOpen(true)
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {app.company?.logo_url ? (
                              <img
                                src={app.company.logo_url}
                                alt={app.company.name}
                                className="h-5 w-5 rounded-sm border border-border object-cover"
                              />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="truncate text-sm font-medium">{app.company?.name ?? app.company_id.slice(0, 8)}</span>
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{app.role}</div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="truncate">{app.stage.name}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDateIndian(app.last_activity_at)}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Applications Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      >
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
                  {apps.map((app, index) => (
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
                        className="cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10"
                        onClick={() => {
                          setSelectedAppId(app.id)
                          setUpdateModalOpen(true)
                        }}
                      >
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
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
                                      <span>{formatDateIndian(app.last_activity_at)}</span>
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
                              <div className="flex items-center">
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
          </CardContent>
        </Card>
      </motion.div>

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




