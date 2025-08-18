import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, Award, Building2, Calendar, ChevronRight, Clock, ExternalLink, Handshake, Phone, Plus, Target, UserPlus } from 'lucide-react'
import { apiWithToken } from '../lib/api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'


const milestoneConfig: Partial<Record<string, { label: string; icon: any }>> = {
  exploration: { label: 'Exploration', icon: Target },
  interviewing: { label: 'Interviewing', icon: Calendar },
  post_interview: { label: 'Post Interview', icon: Award },
}

const sourceConfig: Partial<Record<string, { icon: any; label: string }>> = {
  applied_self: { icon: UserPlus, label: 'Self Applied' },
  applied_referral: { icon: Handshake, label: 'Referral' },
  recruiter_outreach: { icon: Phone, label: 'Recruiter' },
}

export function ApplicationsPage() {
  const { getToken } = useAuth()
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
        const token = await getToken()
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const qs = params.toString()
        const data = await apiWithToken<Array<ApplicationListItem>>(`/v1/applications${qs ? `?${qs}` : ''}`, token!)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken, search])

  const stats = useMemo(() => {
    const total = apps.length
    const active = apps.filter(app => app.stage === 'applied_self' || app.stage === 'applied_referral' || app.stage === 'recruiter_outreach').length
    const interviewing = apps.filter(app => app.milestone === 'interviewing').length
    const offers = apps.filter(app => app.stage === 'offer').length
    return { total, active, interviewing, offers }
  }, [apps])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative space-y-8 h-full"
    >

      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        {[
          { 
            label: 'Total', 
            value: stats.total, 
            icon: Building2, 
            change: '+12%',
            description: 'Applications this month'
          },
          { 
            label: 'Active', 
            value: stats.active, 
            icon: Activity, 
            change: '+8%',
            description: 'Currently in progress'
          },
          { 
            label: 'Interviewing', 
            value: stats.interviewing, 
            icon: Calendar, 
            change: '+23%',
            description: 'Interview scheduled'
          },
          { 
            label: 'Offers', 
            value: stats.offers, 
            icon: Award, 
            change: '+15%',
            description: 'Success rate improving'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + (index * 0.1), ease: "easeOut" }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="relative overflow-hidden border border-border shadow-xs bg-card transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline space-x-1.5">
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{stat.change}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
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
          <CardHeader className="border-b border-border py-2 bg-accent/20">
            <div className="flex items-center justify-end">
              <Badge variant="outline" className="text-xs rounded-4xl">
                {apps.length}
              </Badge>
            </div>
          </CardHeader>
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
                              <div className="flex items-center space-x-2.5">
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const Icon = sourceConfig[app.source]?.icon ?? UserPlus
                                    return <Icon className="h-4 w-4 text-muted-foreground" />
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 min-w-0">
                                    <h3 className="font-medium text-base text-foreground group-hover:text-primary transition-colors truncate">
                                      {app.role}
                                    </h3>
                                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                  </div>
                                  <div className="flex items-center space-x-3 mt-0.5 text-xs text-muted-foreground min-w-0">
                                    <span className="flex items-center space-x-1">
                                      {app.company?.logo_blob_base64 ? (
                                        <img
                                          src={app.company.logo_blob_base64.startsWith('data:') ? app.company.logo_blob_base64 : `data:image/png;base64,${app.company.logo_blob_base64}`}
                                          alt={app.company.name}
                                          className="h-4 w-4 rounded-sm border border-border object-cover"
                                        />
                                      ) : (
                                        <Building2 className="h-3 w-3" />
                                      )}
                                      <span className="truncate max-w-[12rem] sm:max-w-none">{app.company?.name ?? `Company ${app.company_id.slice(0, 8)}...`}</span>
                                    </span>
                                    <span>•</span>
                                    {app.platform && (
                                      <span className="flex items-center space-x-1">
                                        {app.platform.logo_blob_base64 ? (
                                          <img
                                            src={app.platform.logo_blob_base64.startsWith('data:') ? app.platform.logo_blob_base64 : `data:image/png;base64,${app.platform.logo_blob_base64}`}
                                            alt={app.platform.name}
                                            className="h-4 w-4 rounded-sm border border-border object-cover"
                                          />
                                        ) : (
                                          <Building2 className="h-3 w-3" />
                                        )}
                                        <span className="truncate max-w-[10rem]">{app.platform.name}</span>
                                      </span>
                                    )}
                                    {app.platform && <span>•</span>}
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Updated {formatDateIndian(app.last_activity_at)}</span>
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
                                  {milestoneConfig[app.milestone]?.label}
                                </Badge>
                                {/* Only show stage if it's not redundant with source */}
                                {app.stage !== app.source && !['applied_self', 'applied_referral', 'recruiter_outreach'].includes(app.stage) && (
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    {app.stage.replace('_', ' ')}
                                  </Badge>
                                )}
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
          onOpenChange={setUpdateModalOpen}
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




