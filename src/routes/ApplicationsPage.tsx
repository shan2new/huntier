import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Award, Building2, Calendar, ChevronRight, Clock, ExternalLink, Handshake, Phone, Target, UserPlus } from 'lucide-react'
import { apiWithToken } from '../lib/api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApplicationModal } from '@/components/ApplicationModal'
import { formatDateIndian } from '@/lib/utils'

const milestoneConfig = {
  exploration: { label: 'Exploration', icon: Target },
  interviewing: { label: 'Interviewing', icon: Calendar },
  post_interview: { label: 'Post Interview', icon: Award },
}

const sourceConfig = {
  applied_self: { icon: UserPlus, label: 'Self Applied' },
  applied_referral: { icon: Handshake, label: 'Referral' },
  recruiter_outreach: { icon: Phone, label: 'Recruiter' },
}

export function ApplicationsPage() {
  const { getToken } = useAuth()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'view'>('create')
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const search = new URLSearchParams(globalThis.location.search).get('search') || ''

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<Array<ApplicationListItem>>(`/v1/applications?search=${encodeURIComponent(search)}`, token!)
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex space-y-4 flex-row items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-2xl text-foreground tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Track and manage your job applications</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            size="sm"
            onClick={() => {
              setModalMode('create')
              setSelectedAppId(undefined)
              setModalOpen(true)
            }}
          >
            Add
          </Button>
        </motion.div>
      </div>

      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { 
            label: 'Total Applications', 
            value: stats.total, 
            icon: Building2, 
            change: '+12%',
            description: 'Applications this month'
          },
          { 
            label: 'Active Pipeline', 
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
            label: 'Offers Received', 
            value: stats.offers, 
            icon: Award, 
            change: '+15%',
            description: 'Success rate improving'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="relative overflow-hidden border border-border bg-card transition-all duration-200">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span>Applications</span>
                </CardTitle>
              <Badge variant="outline" className="text-xs">
                {apps.length} {apps.length === 1 ? 'application' : 'applications'}
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className="group"
                    >
                      <div 
                        className="cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10"
                        onClick={() => {
                          setModalMode('view')
                          setSelectedAppId(app.id)
                          setModalOpen(true)
                        }}
                      >
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2 min-w-0">
                              <div className="flex items-center space-x-2.5">
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const Icon = sourceConfig[app.source as keyof typeof sourceConfig]?.icon || UserPlus
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
                                  {sourceConfig[app.source as keyof typeof sourceConfig]?.label}
                                </Badge>
                                <Badge className="text-xs font-medium px-2 py-0.5" variant="outline">
                                  {milestoneConfig[app.milestone as keyof typeof milestoneConfig]?.label}
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

      {/* Application Modal */}
      <ApplicationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        applicationId={selectedAppId}
        onCreated={(app) => setApps((prev) => [app, ...prev])}
        onUpdated={(app) => setApps((prev) => prev.map((a) => (a.id === app.id ? app : a)))}
        onDeleted={(id) => setApps((prev) => prev.filter((a) => a.id !== id))}
      />
    </motion.div>
  )
}




