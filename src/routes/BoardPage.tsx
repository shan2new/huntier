import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Building2, Calendar, Clock, GripVertical, MoveRight, Target, Trophy } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { apiWithToken, transitionStage } from '../lib/api'
import type { ApplicationListItem } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<Array<ApplicationListItem>>('/v1/applications', token!)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  async function onDrop(e: React.DragEvent, toStage: string, milestone: string) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    
    try {
      const token = await getToken()
      await transitionStage(token!, id, toStage)
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage: toStage, milestone } : a)))
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-heading-32 tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          Application Board
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Drag and drop to move applications through your pipeline
        </motion.p>
      </div>

      {/* Pipeline Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
      >
        <div className="flex items-center space-x-6">
          {COLUMNS.map((col, index) => {
            const count = apps.filter(app => app.milestone === col.key).length
            return (
              <div key={col.key} className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <col.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium">{col.title}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
                {index < COLUMNS.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-3" />
                )}
              </div>
            )
          })}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Pipeline</p>
          <p className="text-xl font-bold">{apps.length}</p>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map((col, columnIndex) => {
          const columnApps = apps.filter((a) => a.milestone === col.key)
          const isDropTarget = dragOverColumn === col.key
          
          return (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.1 }}
            >
              <Card className={cn(
                "h-fit min-h-[450px] transition-all duration-300",
                isDropTarget ? "ring-2 ring-primary ring-offset-2" : "",
                "border border-border bg-card"
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: draggedItem === app.id ? 0.6 : 1, 
                          scale: draggedItem === app.id ? 0.95 : 1,
                          rotateZ: draggedItem === app.id ? 2 : 0
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileDrag={{ scale: 1.05, rotate: 3, zIndex: 50 }}
                        transition={{ delay: index * 0.02 }}
                        className="cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => onDragStart(e as any, app.id)}
                        onDragEnd={onDragEnd}
                      >
                        <Card className="bg-card/80 border border-border hover:border-primary/40 transition-all duration-200">
                          <CardContent className="p-3">
                            <div className="space-y-2.5">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2 flex-1">
                                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                                    {sourceConfig[app.source as keyof typeof sourceConfig].label}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate">{app.role}</h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {app.company_id.slice(0, 8)}...
                                    </p>
                                  </div>
                                </div>
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" />
                              </div>
                              
                              {/* Badges */}
                              <div className="flex flex-wrap gap-1.5">
                                <Badge className="text-xs font-medium px-1.5 py-0.5 bg-secondary text-secondary-foreground">
                                  {sourceConfig[app.source as keyof typeof sourceConfig].label}
                                </Badge>
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                  {app.stage.replace('_', ' ')}
                                </Badge>
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
                        <col.icon className="h-6 w-6 text-white" />
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
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
    </motion.div>
  )
}


