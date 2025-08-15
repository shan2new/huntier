import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  AlertCircle, Award, Building2, Calendar, Check, Clock, DollarSign, ExternalLink, MessageSquare, Pencil, Plus, Save, Target, Trash2,
} from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import { 
  apiWithToken, createCompany, getApplication, listConversations, listInterviews, listPlatforms, patchApplication,
} from '@/lib/api'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CompensationEditor } from '@/routes/components/CompensationEditor'
import { QASnapshotEditor } from '@/routes/components/QASnapshotEditor'
import { ConversationFeed } from '@/routes/components/ConversationFeed'
import { InterviewsTimeline } from '@/routes/components/InterviewsTimeline'
import { cn, formatDateIndian } from '@/lib/utils'

interface ApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'view' | 'edit'
  applicationId?: string
  onCreated?: (app: ApplicationListItem) => void
  onUpdated?: (app: ApplicationListItem) => void
  onDeleted?: (id: string) => void
}

const sourceOptions = [
  { value: 'applied_self', label: 'Self', icon: '🎯' },
  { value: 'applied_referral', label: 'Referral', icon: '🤝' },
  { value: 'recruiter_outreach', label: 'Recruiter', icon: '📞' },
]

const milestoneConfig = {
  exploration: { label: 'Exploration', icon: Target },
  interviewing: { label: 'Interviewing', icon: Calendar },
  post_interview: { label: 'Post Interview', icon: Award },
}

export function ApplicationModal({
  open,
  onOpenChange,
  mode,
  applicationId,
  onCreated,
  onUpdated,
  onDeleted,
}: ApplicationModalProps) {
  const { getToken } = useAuth()
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Form data
  const [url, setUrl] = useState('')
  const [role, setRole] = useState('')
  const [source, setSource] = useState('applied_self')
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(false)
  
  // Application data for view mode
  const [app, setApp] = useState<any | null>(null)
  const [convs, setConvs] = useState<Array<any>>([])
  const [rounds, setRounds] = useState<Array<any>>([])
  const [platforms, setPlatforms] = useState<Array<Platform>>([])
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)

  // Load application data when in view/edit mode
  useEffect(() => {
    if (!open || mode === 'create' || !applicationId) return
    
    const loadApplication = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const [appData, conversations, interviews] = await Promise.all([
          getApplication<any>(token!, applicationId),
          listConversations<Array<any>>(token!, applicationId),
          listInterviews<Array<any>>(token!, applicationId),
        ])
        
        setApp(appData)
        setConvs(conversations)
        setRounds(interviews)
        
        // Populate form fields for editing
        if (mode === 'edit') {
          setUrl(appData.job_url || '')
          setRole(appData.role || '')
          setSource(appData.source || 'applied_self')
          setCompany(appData.company || null)
        }
      } catch (err) {
        setError('Failed to load application')
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadApplication()
  }, [open, mode, applicationId, getToken])

  // Load platforms for selection
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const token = await getToken()
        const rows = await listPlatforms<Array<Platform>>(token!)
        setPlatforms(rows)
      } catch {
        // ignore silently
      }
    })()
  }, [open, getToken])

  // Auto-fetch company info when URL changes (create mode)
  useEffect(() => {
    if (mode !== 'create' || !url.trim() || !isValidUrl(url)) {
      if (mode === 'create') setCompany(null)
      return
    }

    const fetchCompanyInfo = async () => {
      setIsLoadingCompany(true)
      setError('')
      
      try {
        const token = await getToken()
        // Always call upsert endpoint to fetch metadata first and lazily refresh logo/name
        const upserted = await createCompany<Company>(token!, url)
        setCompany(upserted)
      } catch (err) {
        setError('Failed to fetch company information')
        console.error('Company fetch error:', err)
      } finally {
        setIsLoadingCompany(false)
      }
    }

    const debounceTimer = setTimeout(fetchCompanyInfo, 500)
    return () => clearTimeout(debounceTimer)
  }, [url, getToken, mode])

  const isValidUrl = (str: string) => {
    try {
      const u = new URL(str)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const normalizeUrl = (str: string) => {
    try {
      if (!str) return ''
      if (!str.startsWith('http://') && !str.startsWith('https://')) {
        return `https://${str}`
      }
      return str
    } catch {
      return str
    }
  }

  const handleSubmit = async () => {
    if (!role || (mode === 'create' && (!url || !company))) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const token = await getToken()
      
      if (mode === 'create') {
        const application = await apiWithToken<ApplicationListItem>('/v1/applications', token!, {
          method: 'POST',
          body: JSON.stringify({
            // Send website_url so backend can parse metadata before DB access
            company: { website_url: normalizeUrl(url) },
            role,
            job_url: normalizeUrl(url),
            platform_id: selectedPlatformId,
            source
          })
        })
        onCreated?.(application)
        handleClose()
      } else {
        const updated = await patchApplication<ApplicationListItem>(token!, applicationId!, {
          role,
          job_url: url,
          source,
        })
        setApp({ ...app, ...updated })
        onUpdated?.(updated)
        setIsEditing(false)
      }
    } catch (err) {
      setError(`Failed to ${mode === 'create' ? 'create' : 'update'} application`)
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!applicationId || !confirm('Are you sure you want to delete this application?')) return
    
    setIsSubmitting(true)
    try {
      const token = await getToken()
      await apiWithToken(`/v1/applications/${applicationId}`, token!, { method: 'DELETE' })
      onDeleted?.(applicationId)
      handleClose()
    } catch (err) {
      setError('Failed to delete application')
      console.error('Delete error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setUrl('')
      setRole('')
      setSource('applied_self')
      setCompany(null)
      setApp(null)
      setConvs([])
      setRounds([])
      setError('')
      setIsEditing(mode === 'create' || mode === 'edit')
      setActiveTab('overview')
    }, 150)
  }

  const selectedSource = sourceOptions.find(opt => opt.value === source)

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 border border-border rounded-xl bg-card">
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between px-6 py-4 border-b border-border"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center space-x-4">
              {mode === 'create' ? (
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">Add Application</h1>
                    <p className="text-sm text-muted-foreground">Track a new job opportunity</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {app?.company?.logo_blob_base64 ? (
                    <img
                      src={app.company.logo_blob_base64.startsWith('data:') ? app.company.logo_blob_base64 : `data:image/png;base64,${app.company.logo_blob_base64}`}
                      alt={app.company.name}
                      className="w-10 h-10 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">{app?.role || 'Loading...'}</h1>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {app?.company?.name && <span>{app.company.name}</span>}
                      {app?.company?.name && app?.last_activity_at && <span>•</span>}
                      {app?.last_activity_at && (
                        <span>Updated {formatDateIndian(new Date(app.last_activity_at))}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {mode !== 'create' && (
                <>
                  {app?.job_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8"
                    >
                      <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Job Link
                      </a>
                    </Button>
                  )}
                  
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-8"
                    >
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary"
                  />
                  <span className="text-sm text-muted-foreground">Loading application...</span>
                </motion.div>
              </div>
            ) : mode === 'create' ? (
              <div className="p-6 space-y-6 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto space-y-6"
                >
                  {/* Company URL */}
                  <div className="space-y-3">
                    <label className="text-label-14 text-foreground">Company Job URL</label>
                    <div className="relative">
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onBlur={(e) => setUrl(normalizeUrl(e.target.value))}
                        placeholder="https://company.com/careers/job-123"
                        className="bg-background/50 border-border"
                      />
                      {isLoadingCompany && (
                        <motion.div 
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Company Preview */}
                  <AnimatePresence>
                    {company && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-lg border border-border bg-background/30"
                      >
                        <div className="flex items-center space-x-3">
                          {company.logo_blob_base64 ? (
                            <img 
                              src={company.logo_blob_base64.startsWith('data:') ? company.logo_blob_base64 : `data:image/png;base64,${company.logo_blob_base64}`}
                              alt={company.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-copy-16">{company.name}</h3>
                            <p className="text-sm text-muted-foreground">{company.website_url}</p>
                          </div>
                          <Badge variant="secondary" className="text-label-14">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Role */}
                  <div className="space-y-3">
                    <Label>Role Title</Label>
                    <Input
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Senior Software Engineer"
                      className="bg-background/50 border-border"
                    />
                  </div>

                  {/* Platform */}
                  <div className="space-y-3">
                    <label className="text-label-14 text-foreground">Platform</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {platforms.map((p) => (
                        <Button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlatformId(selectedPlatformId === p.id ? null : p.id)}
                          className={cn(
                            "h-auto p-2.5 flex items-center justify-between rounded-lg border transition-all",
                            selectedPlatformId === p.id
                              ? "bg-accent text-accent-foreground"
                              : "bg-background/50 border-border hover:bg-muted/30"
                          )}
                        >
                          <span className="flex items-center gap-2 text-label-14">
                            {p.logo_blob_base64 ? (
                              <img
                                src={p.logo_blob_base64.startsWith('data:') ? p.logo_blob_base64 : `data:image/png;base64,${p.logo_blob_base64}`}
                                alt={p.name}
                                className="w-4 h-4 rounded-sm border border-border object-cover"
                              />
                            ) : (
                              <span className="w-4 h-4 rounded-sm bg-muted inline-block" />
                            )}
                            {p.name}
                          </span>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full border", selectedPlatformId === p.id ? "border-accent-foreground/40" : "border-border")}>{selectedPlatformId === p.id ? 'Selected' : 'Select'}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="space-y-4">
                    <Label>How did you apply?</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {sourceOptions.map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          variant={source === option.value ? "default" : "outline"}
                          onClick={() => setSource(option.value)}
                          className={cn(
                            "h-auto p-3 flex items-center justify-start gap-3 rounded-lg transition-all",
                            source === option.value 
                              ? "bg-primary text-primary-foreground" 
                              : "border border-border bg-background"
                          )}
                        >
                          <div className="relative w-4 h-4 rounded-full border border-current">
                            {source === option.value && <div className="absolute inset-1 rounded-full bg-current" />}
                          </div>
                          <div className="text-sm font-medium">{option.label}</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <div className="px-6 py-3 border-b border-border">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="overview" className="flex items-center space-x-2 text-sm">
                      <Building2 className="h-4 w-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="compensation" className="flex items-center space-x-2 text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span>Compensation</span>
                    </TabsTrigger>
                    <TabsTrigger value="conversations" className="flex items-center space-x-2 text-sm">
                      <MessageSquare className="h-4 w-4" />
                      <span>Conversations ({convs.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="interviews" className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Interviews ({rounds.length})</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="p-6 m-0">
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                    {isEditing ? (
                      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
                        {/* Left: core fields */}
                        <Card className="border border-border">
                          <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Job URL</label>
                              <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onBlur={(e) => setUrl(normalizeUrl(e.target.value))}
                                placeholder="https://company.com/careers/job-123"
                                className="bg-background/50 border-border"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Role Title</Label>
                              <Input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Senior Software Engineer"
                                className="bg-background/50 border-border"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Right: application source */}
                        <Card className="border border-border">
                          <CardContent className="p-6 space-y-3">
                            <label className="text-sm font-medium text-foreground">Application Source</label>
                            <div className="grid grid-cols-3 gap-3">
                              {sourceOptions.map((option) => (
                                <Button
                                  key={option.value}
                                  type="button"
                                  variant={source === option.value ? "default" : "ghost"}
                                  onClick={() => setSource(option.value)}
                                  className={cn(
                                    "h-auto p-4 flex-col space-y-2",
                                    source === option.value 
                                      ? "bg-primary text-primary-foreground" 
                                      : "border border-border bg-background/50"
                                  )}
                                >
                                  <div className="text-base">{option.icon}</div>
                                  <div className="text-xs font-medium">{option.label}</div>
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
                        {/* Left: status + quick stats */}
                        <Card className="border border-border">
                          <CardContent className="p-6 space-y-6">
                            <div className="flex items-center space-x-3">
                              {selectedSource && (
                                <Badge variant="secondary" className="px-3 py-1.5">
                                  {selectedSource.icon} {selectedSource.label}
                                </Badge>
                              )}
                              {app?.milestone && (
                                <Badge variant="outline" className="px-3 py-1.5">
                                  {milestoneConfig[app.milestone as keyof typeof milestoneConfig].label}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <Card className="border border-border">
                                <CardContent className="p-4 text-center">
                                  <MessageSquare className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                  <div className="text-2xl font-bold">{convs.length}</div>
                                  <div className="text-xs text-muted-foreground">Conversations</div>
                                </CardContent>
                              </Card>
                              <Card className="border border-border">
                                <CardContent className="p-4 text-center">
                                  <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                  <div className="text-2xl font-bold">{rounds.length}</div>
                                  <div className="text-xs text-muted-foreground">Interviews</div>
                                </CardContent>
                              </Card>
                              <Card className="border border-border">
                                <CardContent className="p-4 text-center">
                                  <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                  <div className="text-2xl font-bold">
                                    {app?.created_at ? Math.ceil((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Days Active</div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Right: Q&A */}
                        <QASnapshotEditor 
                          app={app} 
                          onSave={async (payload: any) => {
                            const token = await getToken()
                            const saved = await patchApplication<any>(token!, app.id, { qa_snapshot: payload })
                            setApp(saved)
                            onUpdated?.(saved)
                          }} 
                        />
                      </div>
                    )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="compensation" className="p-6 m-0">
                    <motion.div
                      key="compensation"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CompensationEditor 
                      app={app} 
                      onSave={async (payload: any) => {
                        const token = await getToken()
                        const saved = await patchApplication<any>(token!, app.id, { compensation: payload })
                        setApp(saved)
                        onUpdated?.(saved)
                      }} 
                    />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="conversations" className="p-6 m-0">
                    <motion.div
                      key="conversations"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ConversationFeed 
                      items={convs} 
                      onAdd={async (body: any) => {
                        const token = await getToken()
                        const saved = await apiWithToken<any>(`/v1/applications/${app.id}/conversations`, token!, {
                          method: 'POST',
                          body: JSON.stringify(body)
                        })
                        setConvs(prev => [saved, ...prev])
                      }} 
                    />
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="interviews" className="p-6 m-0">
                    <motion.div
                      key="interviews"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <InterviewsTimeline 
                      items={rounds} 
                      onSchedule={async (body: any) => {
                        const token = await getToken()
                        const saved = await apiWithToken<any>(`/v1/applications/${app.id}/interviews`, token!, {
                          method: 'POST',
                          body: JSON.stringify(body)
                        })
                        setRounds(prev => [...prev, saved])
                      }} 
                    />
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>

          {/* Footer */}
          {(mode === 'create' || isEditing) && (
            <div className="px-6 py-4 border-t border-border bg-background/30">
              <div className="flex items-center justify-between">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2 text-destructive text-copy-14"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
                
                <div className="flex items-center space-x-3 ml-auto">
                  <Button 
                    variant="ghost" 
                    onClick={mode === 'create' ? handleClose : () => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="h-9"
                  >
                    {mode === 'create' ? 'Cancel' : 'Cancel Edit'}
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !role || (mode === 'create' && (!url || !company))}
                    className="min-w-[140px] shadow-soft h-9"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent"
                        />
                        {mode === 'create' ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        {mode === 'create' ? <Plus className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {mode === 'create' ? 'Add Application' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}