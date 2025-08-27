import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, Calendar, Clock, MoveRight, Search, Target, Trophy, X } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { apiWithTokenRefresh, transitionStageWithRefresh } from '../lib/api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { cn, formatDateIndian } from '@/lib/utils'

const COLUMNS = [
  { 
    key: 'exploration', 
    title: 'Exploration', 
    icon: Target,
    gradient: 'primary',
    bgGradient: 'bg-secondary text-secondary-foreground',
    stages: ['recruiter_outreach','applied_self','applied_referral','recruiter_discussion','pending_shortlist','interview_shortlist'] 
  },
  { 
    key: 'interviewing', 
    title: 'Interviewing', 
    icon: Calendar,
    gradient: 'primary',
    bgGradient: 'bg-secondary text-secondary-foreground',
    stages: ['interview_scheduled','interview_rescheduled','interview_completed','interview_passed','interview_rejected'] 
  },
  { 
    key: 'post_interview', 
    title: 'Post-Interview', 
    icon: Trophy,
    gradient: 'primary',
    bgGradient: 'bg-secondary text-secondary-foreground',
    stages: ['offer','rejected','on_hold','withdrawn','accepted'] 
  },
]

const sourceConfig = {
  applied_self: { icon: 'self', label: 'Self Applied' },
  applied_referral: { icon: 'ref', label: 'Referral' },
  recruiter_outreach: { icon: 'rec', label: 'Recruiter' },
}

export function BoardPage() {
  const { getToken } = useAuth()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [search, setSearch] = useState('')
  const [compact, setCompact] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Clerk's getToken returns Promise<string | null>; wrap to ensure non-null for our API helpers
  const getTokenNonNull = useCallback(async () => {
    const t = await getToken()
    if (!t) throw new Error('Missing auth token')
    return t
  }, [getToken])

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiWithTokenRefresh<Array<ApplicationListItem>>('/v1/applications', getTokenNonNull)
      setApps(data)
    } finally {
      setLoading(false)
    }
  }, [getTokenNonNull])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  const visibleApps = useMemo(() => {
    if (!search) return apps
    const q = search.toLowerCase()
    return apps.filter(a =>
      (a.company?.name || a.company_id).toLowerCase().includes(q) ||
      (a.role || '').toLowerCase().includes(q) ||
      (a.stage.name || '').toLowerCase().includes(q)
    )
  }, [apps, search])

  async function onDrop(e: React.DragEvent, toStage: string, milestone: string) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    
    try {
      await transitionStageWithRefresh(getTokenNonNull, id, toStage)
      // Optimistically move card to new column
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, milestone } : a)))
      // Then refetch to ensure we have the correct StageObject
      await fetchApps()
    } catch (error) {
      console.error('Failed to update stage:', error)
    }
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', id)
    setDraggedItem(id)
  }

  function onDragEnd() {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  function onDragOver(e: React.DragEvent, columnKey: string) {
    e.preventDefault()
    setDragOverColumn(columnKey)
  }

  function onDragLeave() {
    setDragOverColumn(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-6xl mx-auto pt-8 space-y-6"
    >
      {/* Toolbar + Stats */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications..." className="pl-9" />
            {search && (
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant={compact ? 'default' : 'outline'} size="sm" onClick={() => setCompact(v => !v)}>
              {compact ? 'Comfortable' : 'Compact'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Sort</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setApps(prev => [...prev].sort((a,b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()))}>Recent activity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setApps(prev => [...prev].sort((a,b) => (a.company?.name || a.company_id).localeCompare(b.company?.name || b.company_id)))}>Company</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setApps(prev => [...prev].sort((a,b) => (a.role || '').localeCompare(b.role || '')))}>Role</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const count = visibleApps.filter(app => app.milestone === col.key).length
              return (
                <div key={col.key} className="flex items-center justify-between gap-2.5 rounded-md border border-border/60 px-3 py-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <col.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{col.title}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Pipeline</p>
            <p className="text-xl font-bold">{visibleApps.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map((col, columnIndex) => {
          const columnApps = visibleApps.filter((a) => a.milestone === col.key)
          const isDropTarget = dragOverColumn === col.key
          
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + (columnIndex * 0.1), ease: "easeOut" }}
            >
              <Card className={cn(
                "h-fit min-h-[450px] transition-all duration-300",
                isDropTarget ? "ring-2 ring-primary ring-offset-2" : "",
                "bg-accent/40"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <col.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{col.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {columnApps.length} {columnApps.length === 1 ? 'application' : 'applications'}
                        </p>
                      </div>
                    </div>
                    <Badge className="text-xs font-medium" variant="secondary">
                      {columnApps.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent 
                  className="space-y-3"
                  onDragOver={(e) => onDragOver(e, col.key)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, col.stages[0], col.key)}
                >
                  <AnimatePresence>
                    {columnApps.map((app, index) => (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: draggedItem === app.id ? 0.6 : 1, 
                          scale: draggedItem === app.id ? 0.95 : 1,
                          rotateZ: draggedItem === app.id ? 2 : 0
                        }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        whileDrag={{ y: -4, rotate: 2, zIndex: 50 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                        className="cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => onDragStart(e as any, app.id)}
                        onDragEnd={onDragEnd}
                      >
                        <Card className={cn("bg-card/80 border border-border hover:border-primary/40 transition-all duration-200", compact ? '' : '')}>
                          <CardContent className={cn("p-3", compact ? 'p-2' : 'p-3')}>
                            <button className="w-full text-left" onClick={() => { setSelectedAppId(app.id); setUpdateModalOpen(true) }}>
                              <div className="space-y-2.5">
                                {/* Header: company left, stage right */}
                                <div className="flex items-start gap-2">
                                  {app.company?.logo_url ? (
                                    <img src={app.company.logo_url} alt={app.company.name || app.company_id} className={cn("rounded-sm border", compact ? 'h-6 w-6' : 'h-7 w-7')} />
                                  ) : (
                                    <Building2 className={cn("text-muted-foreground", compact ? 'h-5 w-5' : 'h-6 w-6')} />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className={cn("font-medium truncate", compact ? 'text-[13px]' : 'text-sm')}>
                                        {app.company?.name ?? app.company_id.slice(0, 8)}
                                      </h4>
                                      <Badge variant="secondary" className={cn("px-2 py-0.5 text-[11px]", compact ? 'text-[10px]' : 'text-[11px]')}>
                                        {app.stage.name}
                                      </Badge>
                                    </div>
                                    <div className={cn("text-muted-foreground truncate", compact ? 'text-[11px]' : 'text-xs')}>
                                      {app.role}
                                    </div>
                                  </div>
                                </div>
                                {/* Middle chips */}
                                <div className="flex flex-wrap gap-1.5">
                                  <Badge className="text-xs font-medium px-1.5 py-0.5 bg-secondary text-secondary-foreground">
                                    {sourceConfig[app.source as keyof typeof sourceConfig].label}
                                  </Badge>
                                  {app.platform && app.platform.name ? (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                      {app.platform.name}
                                    </Badge>
                                  ) : null}
                                </div>
                                {/* Footer */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/50">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{formatDateIndian(app.last_activity_at)}</span>
                                  </div>
                                  <Building2 className="h-2.5 w-2.5" />
                                </div>
                              </div>
                            </button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Empty State */}
                  {columnApps.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed transition-all duration-300",
                        isDropTarget 
                          ? "border-primary bg-primary/5" 
                          : "border-zinc-200/50 dark:border-zinc-800/50 bg-muted/20"
                      )}
                    >
                      <div className={cn("p-3 rounded-full mb-3 bg-gradient-to-br", col.gradient, "opacity-50")}>
                        <col.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <h4 className="font-medium mb-1 text-sm">No applications here</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Drop applications to move to <strong>{col.stages[0].replace('_', ' ')}</strong>
                      </p>
                      {isDropTarget && (
                        <div className="flex items-center space-x-1.5 text-primary font-medium">
                          <MoveRight className="h-3.5 w-3.5" />
                          <span className="text-xs">Drop here</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Drop Zone Hint */}
                  {columnApps.length > 0 && isDropTarget && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-center py-4 border-t border-dashed border-primary/50 bg-primary/5 rounded-lg"
                    >
                      <div className="flex items-center justify-center space-x-2 text-primary font-medium">
                        <MoveRight className="h-4 w-4" />
                        <span className="text-sm">Drop to move to {col.stages[0].replace('_', ' ')}</span>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
      {selectedAppId && (
        <UpdateApplicationModal
          open={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          applicationId={selectedAppId}
          onUpdated={(app: ApplicationListItem) => setApps(prev => prev.map(a => a.id === app.id ? app : a))}
          onDeleted={(id: string) => setApps(prev => prev.filter(a => a.id !== id))}
        />
      )}
    </motion.div>
  )
}


