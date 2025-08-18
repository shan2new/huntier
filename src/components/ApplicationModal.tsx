import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Info,
  MessageSquare,
  Plus,
  Target,
} from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import {
  apiWithToken,
  getApplication,
  getCompanyById,
  listConversations,
  listInterviews,
  listPlatforms,
  patchApplication,
} from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Card, CardContent } from '@/components/ui/card'
import { QASnapshotEditor } from '@/routes/components/QASnapshotEditor'
import { ConversationFeed } from '@/routes/components/ConversationFeed'
import { InterviewsTimeline } from '@/routes/components/InterviewsTimeline'
import { extractHostname, formatDateIndian } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'

interface ApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'view'
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

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <div className="text-sm font-medium text-foreground">{title}</div>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  input,
  hint,
}: {
  label: string
  input: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {input}
      {hint}
    </div>
  )
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

  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  
  // Form data
  const [url, setUrl] = useState('')
  const [role, setRole] = useState('')
  const [source, setSource] = useState('applied_self')
  const [company, setCompany] = useState<Company | null>(null)
  const [platforms, setPlatforms] = useState<Array<Platform>>([])
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [showCompanyDetails, setShowCompanyDetails] = useState(false)
  
  // Application data for view mode
  const [app, setApp] = useState<any | null>(null)
  const [convs, setConvs] = useState<Array<any>>([])
  const [rounds, setRounds] = useState<Array<any>>([])

  // Derived
  const selectedSource = useMemo(() => sourceOptions.find((o) => o.value === source), [source])

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
        
        // If backend doesn't embed company, fetch it using company_id
        let hydratedApp = appData
        if (!hydratedApp.company && hydratedApp.company_id) {
          try {
            const comp = await getCompanyById<Company>(token!, hydratedApp.company_id)
            hydratedApp = { ...hydratedApp, company: comp }
          } catch {
            // ignore if company fetch fails
          }
        }

        setApp(hydratedApp)
        setConvs(conversations)
        setRounds(interviews)
        
        // Populate form fields from loaded data
        setUrl(hydratedApp.job_url || '')
        setRole(hydratedApp.role || '')
        setSource(hydratedApp.source || 'applied_self')
        setCompany(hydratedApp.company || null)
        setSelectedPlatformId(hydratedApp.platform_id || null)
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

  // Removed URL-driven company auto-fetch. Company is selected via combobox now.


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

  // Flush form state whenever create modal opens to avoid stale values
  useEffect(() => {
    if (open && mode === 'create') {
      setUrl('')
      setRole('')
      setSource('applied_self')
      setCompany(null)
      setSelectedPlatformId(null)
      setShowCompanyDetails(false)
      setError('')
    }
  }, [open, mode])

  const handleSubmit = async () => {
    if (!role || (mode === 'create' && !company)) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const token = await getToken()
      
      if (mode === 'create') {
        const application = await apiWithToken<ApplicationListItem>('/v1/applications', token!, {
          method: 'POST',
          body: JSON.stringify({
            company: { company_id: company!.id },
            role,
            job_url: url ? normalizeUrl(url) : undefined,
            platform_id: selectedPlatformId,
            source,
          }),
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

    }, 150)
  }

  const modalTitle = useMemo(() => (mode === 'create' ? 'Add Application' : app?.role || 'Application'), [mode, app?.role])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] p-0 gap-0 border border-border rounded-xl bg-card">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              {mode !== 'create' ? (
                app?.company?.logo_blob_base64 ? (
                  <img
                    src={app.company.logo_blob_base64.startsWith('data:') ? app.company.logo_blob_base64 : `data:image/png;base64,${app.company.logo_blob_base64}`}
                    alt={app.company.name}
                    className="w-10 h-10 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight truncate">{modalTitle}</div>
                {mode !== 'create' && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                    {app?.company?.name && <span className="truncate">{app.company.name}</span>}
                    {app?.company?.name && app?.last_activity_at && <span>•</span>}
                    {app?.last_activity_at && <span>Updated {formatDateIndian(new Date(app.last_activity_at))}</span>}
                  </div>
                )}
              </div>
            </div>
            {mode !== 'create' && (
              <div className="flex items-center gap-2">
                {/* Job Link moved to be beside Role Title */}
              </div>
            )}
          </div>

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
              <div className="p-6 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="max-w-4xl mx-auto space-y-6"
                >
                  <Card className="border border-border">
                    <CardContent className="p-6 space-y-6">
                      <Field
                        label="Company"
                        input={
                          <CompanySearchCombobox
                            value={company}
                            onChange={(c) => setCompany(c)}
                            placeholder="Search companies by name"
                            variant="dialog"
                          />

                        }
                      />

                      {/* Job URL - Optional and less prominent */}
                      <Field
                        label="Job URL (optional)"
                        input={
                          <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onBlur={(e) => setUrl(normalizeUrl(e.target.value))}
                            placeholder="https://company.com/careers/job-123"
                            className="bg-background/50 border-border"
                          />
                        }
                        hint={<p className="text-xs text-muted-foreground">Optional: Link to the job posting</p>}
                      />

                      <AnimatePresence>
                        {company && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="p-4 rounded-lg border border-border bg-background/30 flex items-center gap-3">
                              {company.logo_blob_base64 ? (
                                <img
                                  src={company.logo_blob_base64.startsWith('data:') ? company.logo_blob_base64 : `data:image/png;base64,${company.logo_blob_base64}`}
                                  alt={company.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-border"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{company.name}</div>
                                <div className="text-xs text-muted-foreground truncate flex gap-2 items-center">
                                  <a
                                    className="truncate inline-flex items-center gap-1 text-primary"
                                    href={company.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3" /> {extractHostname(company.website_url)}
                                  </a>
                                  {company.founded_year && <span>• Founded {company.founded_year}</span>}
                                  {company.hq && (company.hq.city || company.hq.country) && (
                                    <span>• {(company.hq.city ? company.hq.city + ', ' : '') + (company.hq.country || '')}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {company.industries?.[0] && (
                                  <Badge variant="secondary" className="text-xs">{company.industries[0]}</Badge>
                                )}
                                <Button variant="secondary" size="sm" onClick={() => setShowCompanyDetails(true)}>
                                  View details
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Field
                        label="Role Title"
                        input={
                          <Input
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="Senior Software Engineer"
                            className="bg-background/50 border-border"
                          />
                        }
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field
                          label="Platform"
                          input={
                            <Select value={selectedPlatformId ?? ''} onValueChange={(v) => setSelectedPlatformId(v || null)}>
                              <SelectTrigger className="bg-background/50 border-border">
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Platforms</SelectLabel>
                                  {platforms.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      <div className="flex items-center gap-2">
                                        {p.logo_blob_base64 ? (
                                          <img
                                            src={p.logo_blob_base64.startsWith('data:') ? p.logo_blob_base64 : `data:image/png;base64,${p.logo_blob_base64}`}
                                            alt={p.name}
                                            className="w-4 h-4 rounded-sm border border-border object-cover"
                                          />
                                        ) : (
                                          <span className="w-4 h-4 rounded-sm bg-muted inline-block" />
                                        )}
                                        <span>{p.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          }
                          hint={<p className="text-xs text-muted-foreground">Optional: Where you found or applied for this role</p>}
                        />

                        <Field
                          label="Application Source"
                          input={
                            <Select value={source} onValueChange={setSource}>
                              <SelectTrigger className="bg-background/50 border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>How did you apply?</SelectLabel>
                                  {sourceOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <span>{option.icon}</span>
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company Details Dialog */}
                  <Dialog open={showCompanyDetails} onOpenChange={setShowCompanyDetails}>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Company Details</DialogTitle>
                      </DialogHeader>
                      {company && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            {company.logo_blob_base64 ? (
                              <img
                                src={company.logo_blob_base64.startsWith('data:') ? company.logo_blob_base64 : `data:image/png;base64,${company.logo_blob_base64}`}
                                alt={company.name}
                                className="w-10 h-10 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium truncate">{company.name}</div>
                              <a className="text-xs text-primary truncate inline-flex items-center gap-1" href={company.website_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3 w-3" /> {extractHostname(company.website_url)}
                              </a>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {company.founded_year && <div>Founded: {company.founded_year}</div>}
                            {company.hq && (company.hq.city || company.hq.country) && (
                              <div>HQ: {(company.hq.city ? company.hq.city + ', ' : '') + (company.hq.country || '')}</div>
                            )}
                            {company.industries && company.industries.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {company.industries.map((i, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{i}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {company.description && (
                            <div className="text-sm leading-relaxed">{company.description}</div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Main Content Area (Left) */}
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 h-full min-h-0">
                    <div className="p-6">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-6"
                      >
                    {/* Basic Info - Always Editable */}
                    <Card className="border border-border">
                      <CardContent className="p-6 space-y-6">
                        <Section title="Application Details" icon={<Briefcase className="h-4 w-4" />}>
                          <div className="space-y-4">
                            <Field
                              label="Job URL"
                              input={
                                <Input
                                  value={url}
                                  onChange={(e) => setUrl(e.target.value)}
                                  onBlur={async (e) => {
                                    const normalizedUrl = normalizeUrl(e.target.value)
                                    setUrl(normalizedUrl)
                                    if (app && normalizedUrl !== app.job_url) {
                                      try {
                                        const token = await getToken()
                                        const saved = await patchApplication<any>(token!, app.id, { job_url: normalizedUrl })
                                        setApp(saved)
                                        onUpdated?.(saved)
                                      } catch (err) {
                                        console.error('Failed to update URL:', err)
                                      }
                                    }
                                  }}
                                  placeholder="https://company.com/careers/job-123"
                                  className="bg-background/50 border-border"
                                />
                              }
                            />
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-foreground">Role Title</div>
                                {app?.job_url && (
                                  <Button variant="ghost" size="sm" asChild className="h-8">
                                    <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1.5" />
                                      Job Link
                                    </a>
                                  </Button>
                                )}
                              </div>
                              <Input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                onBlur={async (e) => {
                                  if (app && e.target.value !== app.role) {
                                    try {
                                      const token = await getToken()
                                      const saved = await patchApplication<any>(token!, app.id, { role: e.target.value })
                                      setApp(saved)
                                      onUpdated?.(saved)
                                    } catch (err) {
                                      console.error('Failed to update role:', err)
                                    }
                                  }
                                }}
                                placeholder="Senior Software Engineer"
                                className="bg-background/50 border-border"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Field
                                label="Platform"
                                input={
                                  <Select 
                                    value={selectedPlatformId ?? ''} 
                                    onValueChange={async (v) => {
                                      const newPlatformId = v || null
                                      setSelectedPlatformId(newPlatformId)
                                      if (app) {
                                        try {
                                          const token = await getToken()
                                          const saved = await patchApplication<any>(token!, app.id, { platform_id: newPlatformId })
                                          setApp(saved)
                                          onUpdated?.(saved)
                                        } catch (err) {
                                          console.error('Failed to update platform:', err)
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="bg-background/50 border-border">
                                      <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Platforms</SelectLabel>
                                        {platforms.map((p) => (
                                          <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center gap-2">
                                              {p.logo_blob_base64 ? (
                                                <img
                                                  src={p.logo_blob_base64.startsWith('data:') ? p.logo_blob_base64 : `data:image/png;base64,${p.logo_blob_base64}`}
                                                  alt={p.name}
                                                  className="w-4 h-4 rounded-sm border border-border object-cover"
                                                />
                                              ) : (
                                                <span className="w-4 h-4 rounded-sm bg-muted inline-block" />
                                              )}
                                              <span>{p.name}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                }
                              />

                              <Field
                                label="Application Source"
                                input={
                                  <Select 
                                    value={source} 
                                    onValueChange={async (v) => {
                                      setSource(v)
                                      if (app) {
                                        try {
                                          const token = await getToken()
                                          const saved = await patchApplication<any>(token!, app.id, { source: v })
                                          setApp(saved)
                                          onUpdated?.(saved)
                                        } catch (err) {
                                          console.error('Failed to update source:', err)
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="bg-background/50 border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>How did you apply?</SelectLabel>
                                        {sourceOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                              <span>{option.icon}</span>
                                              <span>{option.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                }
                              />
                            </div>
                          </div>
                        </Section>

                        {/* Application Status */}
                        <Section title="Status" icon={<BarChart3 className="h-4 w-4" />}>
                          <div className="flex items-center gap-3 flex-wrap">
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
                            {app?.stage && app.stage !== app.source && (
                              <Badge variant="outline" className="px-3 py-1.5">
                                {app.stage.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        </Section>
                      </CardContent>
                    </Card>

                    {/* Conversations */}
                    <Card className="border border-border">
                      <CardContent className="p-6">
                        <Section title={`Conversations (${convs.length})`} icon={<MessageSquare className="h-4 w-4" />}>
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
                        </Section>
                      </CardContent>
                    </Card>

                    {/* Interviews */}
                    <Card className="border border-border">
                      <CardContent className="p-6">
                        <Section title={`Interviews (${rounds.length})`} icon={<Calendar className="h-4 w-4" />}>
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
                        </Section>
                      </CardContent>
                    </Card>

                    {/* Q&A Snapshot - Moved to bottom */}
                    <QASnapshotEditor 
                      app={app} 
                      onSave={async (payload: any) => {
                        const token = await getToken()
                        const saved = await patchApplication<any>(token!, app.id, { qa_snapshot: payload })
                        setApp(saved)
                        onUpdated?.(saved)
                      }} 
                    />
                        </motion.div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-80 flex-shrink-0 border-l border-border bg-muted/10 overflow-y-auto hidden lg:block min-h-0">
                  <div className="p-4 space-y-4">
                    {/* Activity Summary */}
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Activity Summary</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Conversations</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{convs.length}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Interviews</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{rounds.length}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Days Active</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {app?.created_at ? Math.ceil((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compensation Editor - Compact Sidebar Version */}
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Compensation</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Fixed Range (LPA)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Min"
                                value={app?.compensation?.fixed_min_lpa || ''}
                                onChange={(e) => {
                                  // Handle inline compensation updates
                                  const value = e.target.value
                                  if (app) {
                                    setTimeout(async () => {
                                      try {
                                        const token = await getToken()
                                        const saved = await patchApplication<any>(token!, app.id, { 
                                          compensation: {
                                            ...app.compensation,
                                            fixed_min_lpa: value ? Number(value) : null
                                          }
                                        })
                                        setApp(saved)
                                        onUpdated?.(saved)
                                      } catch (err) {
                                        console.error('Failed to update compensation:', err)
                                      }
                                    }, 1000)
                                  }
                                }}
                                className="bg-background/50 border-border text-xs h-8"
                              />
                              <Input
                                placeholder="Max"
                                value={app?.compensation?.fixed_max_lpa || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (app) {
                                    setTimeout(async () => {
                                      try {
                                        const token = await getToken()
                                        const saved = await patchApplication<any>(token!, app.id, { 
                                          compensation: {
                                            ...app.compensation,
                                            fixed_max_lpa: value ? Number(value) : null
                                          }
                                        })
                                        setApp(saved)
                                        onUpdated?.(saved)
                                      } catch (err) {
                                        console.error('Failed to update compensation:', err)
                                      }
                                    }, 1000)
                                  }
                                }}
                                className="bg-background/50 border-border text-xs h-8"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Variable Range (LPA)</label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="Min"
                                value={app?.compensation?.var_min_lpa || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (app) {
                                    setTimeout(async () => {
                                      try {
                                        const token = await getToken()
                                        const saved = await patchApplication<any>(token!, app.id, { 
                                          compensation: {
                                            ...app.compensation,
                                            var_min_lpa: value ? Number(value) : null
                                          }
                                        })
                                        setApp(saved)
                                        onUpdated?.(saved)
                                      } catch (err) {
                                        console.error('Failed to update compensation:', err)
                                      }
                                    }, 1000)
                                  }
                                }}
                                className="bg-background/50 border-border text-xs h-8"
                              />
                              <Input
                                placeholder="Max"
                                value={app?.compensation?.var_max_lpa || ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (app) {
                                    setTimeout(async () => {
                                      try {
                                        const token = await getToken()
                                        const saved = await patchApplication<any>(token!, app.id, { 
                                          compensation: {
                                            ...app.compensation,
                                            var_max_lpa: value ? Number(value) : null
                                          }
                                        })
                                        setApp(saved)
                                        onUpdated?.(saved)
                                      } catch (err) {
                                        console.error('Failed to update compensation:', err)
                                      }
                                    }, 1000)
                                  }
                                }}
                                className="bg-background/50 border-border text-xs h-8"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                            <textarea
                              placeholder="Benefits, equity, etc."
                              value={app?.compensation?.note || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (app) {
                                  setTimeout(async () => {
                                    try {
                                      const token = await getToken()
                                      const saved = await patchApplication<any>(token!, app.id, { 
                                        compensation: {
                                          ...app.compensation,
                                          note: value || null
                                        }
                                      })
                                      setApp(saved)
                                      onUpdated?.(saved)
                                    } catch (err) {
                                      console.error('Failed to update compensation:', err)
                                    }
                                  }, 1000)
                                }
                              }}
                              className="w-full text-xs p-2 rounded border border-border bg-background/50 min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Application Details */}
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span>Details</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          {app?.created_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created</span>
                              <span>{formatDateIndian(new Date(app.created_at))}</span>
                            </div>
                          )}
                          {app?.last_activity_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Activity</span>
                              <span>{formatDateIndian(new Date(app.last_activity_at))}</span>
                            </div>
                          )}
                          {app?.platform_id && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Platform</span>
                              <span className="truncate">
                                {platforms.find(p => p.id === app.platform_id)?.name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-background/30">
            <div className="flex items-center justify-between">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex items-center space-x-2 text-destructive text-copy-14"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </motion.div>
              )}
              
              <div className="flex items-center w-full">
                {mode === 'create' ? (
                  <div className="flex items-center justify-between w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      variant="default"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !role || !company}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent"
                          />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Application
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  
                  <div className="flex items-center justify-between w-full">
                    <Button 
                    size="sm"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                    <Button 
                    size="sm"
                      onClick={() => {
                        handleClose()
                      }}
                      disabled={isSubmitting}
                    >
                      Save
                    </Button>
                    
                    </div>                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}