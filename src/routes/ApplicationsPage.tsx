import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiWithToken } from '../lib/api'
import type { ApplicationListItem } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Building2, Calendar, Activity, TrendingUp, Target, Clock, Award, ChevronRight, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ApplicationModal } from '@/components/ApplicationModal'
import { cn, formatDateIndian } from '@/lib/utils'

const milestoneConfig = {
  exploration: {
    label: 'Exploration',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'gradient-exploration',
    textColor: 'text-blue-700',
    icon: Target,
  },
  interviewing: {
    label: 'Interviewing', 
    color: 'from-amber-500 to-orange-600',
    bgColor: 'gradient-interviewing',
    textColor: 'text-amber-700',
    icon: Calendar,
  },
  post_interview: {
    label: 'Post Interview',
    color: 'from-emerald-500 to-green-600', 
    bgColor: 'gradient-post-interview',
    textColor: 'text-emerald-700',
    icon: Award,
  },
}

const sourceConfig = {
  applied_self: { icon: '🎯', label: 'Self Applied', color: 'bg-blue-100 text-blue-800' },
  applied_referral: { icon: '🤝', label: 'Referral', color: 'bg-purple-100 text-purple-800' },
  recruiter_outreach: { icon: '📞', label: 'Recruiter', color: 'bg-green-100 text-green-800' },
}

export function ApplicationsPage() {
  const { getToken } = useAuth()
  const [apps, setApps] = useState<ApplicationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>('create')
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const search = new URLSearchParams(globalThis.location.search).get('search') || ''

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<ApplicationListItem[]>(`/v1/applications?search=${encodeURIComponent(search)}`, token!)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken, search])

  const stats = useMemo(() => {
    const total = apps.length
    const active = apps.filter(app => app.status === 'active').length
    const interviewing = apps.filter(app => app.milestone === 'interviewing').length
    const offers = apps.filter(app => app.stage === 'offer').length
    return { total, active, interviewing, offers }
  }, [apps])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Applications
          </h1>
          <p className="text-muted-foreground">Track and manage your job applications with style</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-soft hover:shadow-soft-lg transition-all duration-200"
            onClick={() => {
              setModalMode('create')
              setSelectedAppId(undefined)
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </motion.div>
      </div>

      {/* Enhanced Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { 
            label: 'Total Applications', 
            value: stats.total, 
            icon: Building2, 
            gradient: 'from-blue-500 to-indigo-600',
            change: '+12%',
            description: 'Applications this month'
          },
          { 
            label: 'Active Pipeline', 
            value: stats.active, 
            icon: Activity, 
            gradient: 'from-emerald-500 to-green-600',
            change: '+8%',
            description: 'Currently in progress'
          },
          { 
            label: 'Interviewing', 
            value: stats.interviewing, 
            icon: Calendar, 
            gradient: 'from-amber-500 to-orange-600',
            change: '+23%',
            description: 'Interview scheduled'
          },
          { 
            label: 'Offers Received', 
            value: stats.offers, 
            icon: Award, 
            gradient: 'from-purple-500 to-pink-600',
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
            <Card className="relative overflow-hidden glass shadow-soft hover:shadow-soft-lg transition-all duration-200 hide-scrollbar">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline space-x-1.5">
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={cn("p-2 rounded-lg bg-gradient-to-br shadow-soft", stat.gradient)}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className={cn("absolute bottom-0 left-0 h-0.5 bg-gradient-to-r", stat.gradient)} style={{ width: '100%' }} />
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
        <Card className="glass shadow-soft-lg">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Your Applications</CardTitle>
              <Badge variant="outline" className="text-xs">
                {apps.length} {apps.length === 1 ? 'application' : 'applications'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
                />
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {apps.map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.01 }}
                      className="group"
                    >
                      <Card 
                        className="cursor-pointer transition-all duration-300 hover:shadow-soft border border-border/50 hover:border-primary/20 bg-card/50 hover:bg-card"
                        onClick={() => {
                          setModalMode('view')
                          setSelectedAppId(app.id)
                          setModalOpen(true)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2.5">
                                <div className="flex-shrink-0">
                                  <span className="text-xl">
                                    {sourceConfig[app.source as keyof typeof sourceConfig]?.icon}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                                      {app.role}
                                    </h3>
                                    <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                  </div>
                                  <div className="flex items-center space-x-3 mt-0.5 text-xs text-muted-foreground">
                                    <span className="flex items-center space-x-1">
                                      {app.company?.logo_blob_base64 ? (
                                        <img
                                          src={app.company.logo_blob_base64.startsWith('data:') ? app.company.logo_blob_base64 : `data:image/png;base64,${app.company.logo_blob_base64}`}
                                          alt={app.company.name}
                                          className="h-4 w-4 rounded-sm border border-border/50 object-cover"
                                        />
                                      ) : (
                                        <Building2 className="h-3 w-3" />
                                      )}
                                      <span>{app.company?.name ?? `Company ${app.company_id.slice(0, 8)}...`}</span>
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
                            
                            <div className="flex items-center space-x-2.5 shrink-0">
                              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                                <Badge 
                                  className={cn(
                                    "text-xs font-medium px-2 py-0.5",
                                    sourceConfig[app.source as keyof typeof sourceConfig]?.color
                                  )}
                                >
                                  {sourceConfig[app.source as keyof typeof sourceConfig]?.label}
                                </Badge>
                                <Badge 
                                  className={cn(
                                    "text-xs font-medium px-2 py-0.5",
                                    milestoneConfig[app.milestone as keyof typeof milestoneConfig]?.textColor,
                                    milestoneConfig[app.milestone as keyof typeof milestoneConfig]?.bgColor
                                  )}
                                >
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
                        </CardContent>
                      </Card>
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
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-3">
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




