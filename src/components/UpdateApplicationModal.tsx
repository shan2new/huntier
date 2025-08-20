import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import {
  AlertCircle,
  Briefcase,
  Building2,
  DollarSign,
  ExternalLink,
  Globe,
  Info,
  Users,
} from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import {
  apiWithToken,
  getApplication,
  getCompanyById,
  listPlatforms,
  patchApplication,
} from '@/lib/api'
import { cn, extractHostname, formatDateIndian } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApplicationNotes } from '@/components/ApplicationNotes'
import { ApplicationConversations } from '@/components/ApplicationConversations'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'
import { PlatformCombobox } from '@/components/PlatformCombobox'
import { RoleSuggestionCombobox } from '@/components/RoleSuggestionCombobox'
import { StageVisualization } from '@/components/StageVisualization'


const sourceOptions = [
  { value: 'applied_self', label: 'Self', icon: '🎯' },
  { value: 'applied_referral', label: 'Referral', icon: '🤝' },
  { value: 'recruiter_outreach', label: 'Recruiter', icon: '📞' },
]

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

interface UpdateApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  onUpdated?: (app: ApplicationListItem) => void
  onDeleted?: (id: string) => void
}

export function UpdateApplicationModal({
  open,
  onOpenChange,
  applicationId,
  onUpdated: _onUpdated,
  onDeleted,
}: UpdateApplicationModalProps) {
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Application data
  const [app, setApp] = useState<any | null>(null)

  // Form fields
  const [url, setUrl] = useState('')
  const [role, setRole] = useState('')
  const [source, setSource] = useState('applied_self')
  const [includeJobUrl, setIncludeJobUrl] = useState(false) // Use platform list to display names
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [companySearchOpen, setCompanySearchOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Auth token for notes component
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Tab state for Notes/Conversations
  const [activeTab, setActiveTab] = useState<'notes' | 'conversations'>('notes')

  // Stage visualization state
  const [stageVisualizationOpen, setStageVisualizationOpen] = useState(false)

  // Compensation fields
  const [fixedMinLpa, setFixedMinLpa] = useState('')
  const [fixedMaxLpa, setFixedMaxLpa] = useState('')
  const [varMinLpa, setVarMinLpa] = useState('')
  const [varMaxLpa, setVarMaxLpa] = useState('')

  // Status fields
  const [stageStatus, setStageStatus] = useState('applied')

  const stageStatusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'interview', label: 'Interviewing' },
    { value: 'offered', label: 'Offered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ]

  // Consider these stages as "in progress" for a visual pulse indicator
  const inProgressStages = new Set(['applied', 'interview', 'offered'])
  const isInProgress = inProgressStages.has(stageStatus)

  // Get auth token for API calls
  useEffect(() => {
    if (open) {
      getToken().then(token => setAuthToken(token))
    }
  }, [open, getToken])

  // Load application data
  useEffect(() => {
    if (!open || !applicationId) return

    const loadApplication = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const appData = await getApplication<any>(token!, applicationId)

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

        // Populate form fields from loaded data
        setUrl(hydratedApp.job_url || '')
        setRole(hydratedApp.role || '')
        setSource(hydratedApp.source || 'applied_self')
        setSelectedPlatformId(hydratedApp.platform_id || null)
        setStageStatus(hydratedApp.stage || 'applied')

        // Populate compensation data if available
        if (hydratedApp.compensation) {
          setFixedMinLpa(hydratedApp.compensation.fixed_min_lpa?.toString() || '')
          setFixedMaxLpa(hydratedApp.compensation.fixed_max_lpa?.toString() || '')
          setVarMinLpa(hydratedApp.compensation.var_min_lpa?.toString() || '')
          setVarMaxLpa(hydratedApp.compensation.var_max_lpa?.toString() || '')
        }
        if (hydratedApp.platform) setSelectedPlatform(hydratedApp.platform)
        setIncludeJobUrl(!!hydratedApp.job_url)
      } catch (err) {
        setError('Failed to load application')
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadApplication()
  }, [open, applicationId, getToken])

  // Load platforms for selection
  useEffect(() => {
    if (open && authToken) {
      listPlatforms(authToken)
        .then((response) => {
          const platformData = response as Array<Platform>
          // Set selected platform if application already has one
          if (app?.platform_id) {
            const platform = platformData.find((p) => p.id === app.platform_id)
            if (platform) {
              setSelectedPlatform(platform)
              setSelectedPlatformId(platform.id)
            }
          }
        })
        .catch(console.error)
    }
  }, [open, authToken, app])

  const handleSave = async () => {
    if (!role || !app) return

    setIsSubmitting(true)
    setError('')

    try {
      const token = await getToken()
      const updated = await patchApplication<ApplicationListItem>(token!, applicationId, {
        role,
        job_url: includeJobUrl ? url : null,
        source,
        stage: stageStatus,
        platform_id: selectedPlatformId,
      })

      setApp({ ...app, ...updated })
      _onUpdated?.(updated)
      handleClose()
    } catch (err) {
      setError('Failed to update application')
      console.error('Save error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update stage immediately from header dropdown
  const updateStage = async (value: string) => {
    setStageStatus(value)
    try {
      const token = await getToken()
      const updated = await patchApplication<ApplicationListItem>(token!, applicationId, {
        stage: value,
      })
      const hydrated = { ...(app ?? {}), ...updated, stage: value }
      setApp(hydrated)
      _onUpdated?.(updated)
      setError('')
    } catch (err) {
      console.error('Failed to update status:', err)
      setError('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!applicationId) return
    setIsSubmitting(true)
    setError('')
    try {
      const token = await getToken()
      await apiWithToken(`/v1/applications/${applicationId}`, token!, { method: 'DELETE' })
      onDeleted?.(applicationId)
      setShowDeleteConfirm(false)
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
      setApp(null)
      setUrl('')
      setRole('')
      setSource('applied_self')
      setIncludeJobUrl(false)
      setSelectedPlatformId(null)
      setError('')
    }, 150)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-5xl p-0 gap-0 border border-border rounded-xl bg-card">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
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
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight truncate">
                    {app?.role || 'Application'}
                  </DialogTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                    {app?.company?.name && <span className="truncate">{app.company.name}</span>}
                    {app?.company?.hq && (app.company.hq.city || app.company.hq.country) && (
                      <>
                        <span>•</span>
                        <span>{(app.company.hq.city ? app.company.hq.city + ', ' : '') + (app.company.hq.country || '')}</span>
                      </>
                    )}
                    {app?.company?.website_url && (
                      <>
                        <span>•</span>
                        <a
                          className="truncate inline-flex items-center gap-1 text-primary"
                          href={app.company.website_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" /> {extractHostname(app.company.website_url)}
                        </a>
                      </>
                    )}
                    {app?.last_activity_at && (
                      <>
                        <span>•</span>
                        <span>Updated {formatDateIndian(new Date(app.last_activity_at))}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {app && (
                <div className="flex items-center gap-2">
                  {/* Status badge dropdown */}
                  {isInProgress && (
                    <div className="relative mr-1 h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="cursor-pointer rounded-full px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      role="button"
                      aria-label="View stage timeline"
                      onClick={() => setStageVisualizationOpen(true)}
                    >
                      {stageStatusOptions.find((s) => s.value === stageStatus)?.label || stageStatus}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <span className="sr-only">Change status</span>
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {stageStatusOptions.map((option) => (
                          <DropdownMenuItem key={option.value} onSelect={() => updateStage(option.value)}>
                            <Badge variant="outline">{option.label}</Badge>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Company change combobox */}
                  <CompanySearchCombobox
                    value={app.company || null}
                    onChange={async (c) => {
                      if (!c || !app) return
                      try {
                        const token = await getToken()
                        const updated = await patchApplication<any>(token!, app.id, { company_id: c.id })
                        const hydrated = { ...(app || {}), ...(updated || {}), company: c, company_id: c.id }
                        setApp(hydrated)
                        // reflect derived fields locally
                        setSelectedPlatformId(hydrated.platform_id || null)
                        setSource(hydrated.source || source)
                        setRole(hydrated.role || role)
                        setUrl(hydrated.job_url || url)
                        setIncludeJobUrl(!!hydrated.job_url)
                        setCompanySearchOpen(false)
                        setError('')
                        _onUpdated?.(hydrated)
                      } catch (err) {
                        console.error('Failed to change company:', err)
                        setError('Failed to change company')
                      }
                    }}
                    open={companySearchOpen}
                    onOpenChange={setCompanySearchOpen}
                    variant="dialog"
                    triggerAsChild={
                      <Button variant="outline" size="sm" className="h-8 px-3">
                        Change
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center min-h-[calc(70vh-8rem)]">
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
            ) : (
              <div className="flex-1 overflow-y-auto p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative grid grid-cols-[3fr_2fr] gap-3 h-full px-2"
                >
                  <div className="absolute inset-y-0 left-[60%] -translate-x-1/2 w-px bg-border pointer-events-none" aria-hidden="true"></div>

                  {/* Column 1: Core Details */}
                  <div className="space-y-4 pr-6 overflow-y-auto max-h-[calc(70vh-8rem)]" style={{ scrollbarWidth: 'thin' }}>

                  <Card>
                  <CardContent className="space-y-2 bg-background/30 py-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Role
                      </Label>
                      {app?.company?.id ? (
                        <RoleSuggestionCombobox
                          companyId={app.company.id}
                          onChoose={(s) => setRole(s.role)}
                          currentRole={role}
                          showAsInput
                          inputValue={role}
                          onInputValueChange={setRole}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full"
                        />
                      ) : (
                        <Input
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="Senior Software Engineer"
                          className="w-full"
                        />
                      )}
                    </div>
                    {/* Job URL with toggle */}
                    <div className="space-y-2 w-full">
                      <div className="flex items-center space-x-2 w-full justify-end">
                        <Checkbox
                          id="include-job-url"
                          checked={includeJobUrl}
                          onCheckedChange={(checked) => setIncludeJobUrl(!!checked)}
                        />
                        <Label htmlFor="include-job-url" className="flex items-center gap-2 text-xs">
                          Include Job Link
                        </Label>
                      </div>

                      <AnimatePresence>
                        {includeJobUrl && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="space-y-2"
                          >
                            <Label className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Job URL
                            </Label>
                            <Input
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              onBlur={(e) => setUrl(normalizeUrl(e.target.value))}
                              placeholder="https://company.com/careers/job-123"
                              className="w-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                  </Card>

                    {/* Notes & Conversations Tabs */}
                    <Card className="mt-6">
                      <CardContent className="p-0 bg-background/50">
                        <div className="space-y-3">
                          <div className="flex gap-2 border-b px-2 pt-0">
                            <button
                              onClick={() => setActiveTab('notes')}
                              className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors relative",
                                activeTab === 'notes'
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Notes
                              {activeTab === 'notes' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                              )}
                            </button>
                            <button
                              onClick={() => setActiveTab('conversations')}
                              className={cn(
                                "px-3 py-2 text-sm font-medium transition-colors relative",
                                activeTab === 'conversations'
                                  ? "text-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              Conversations
                              {activeTab === 'conversations' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                              )}
                            </button>
                          </div>

                          <div className="px-6 pb-6">
                            {activeTab === 'notes' ? (
                              <ApplicationNotes
                                applicationId={applicationId}
                                token={authToken}
                              />
                            ) : (
                              <ApplicationConversations
                                applicationId={applicationId}
                                token={authToken}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Column 2: Additional Details */}
                  <ScrollArea className="space-y-4 pl-4 h-[calc(70vh-8rem)]">
                  {/* <div className="space-y-4 pl-6 overflow-y-auto max-h-[calc(70vh-8rem)]" style={{ scrollbarWidth: 'thin' }}> */}
                    {/* Compensation */}
                    <Card>
                      <CardContent className="space-y-3 bg-background/30 py-4">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Compensation
                        </Label>
                        <div className="space-y-3">
                          {/* Fixed */}
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={fixedMinLpa}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setFixedMinLpa(value)
                                }
                              }}
                              className="w-full"
                              placeholder="Fixed Min (LPA)"
                            />
                            <Input
                              value={fixedMaxLpa}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setFixedMaxLpa(value)
                                }
                              }}
                              className="w-full"
                              placeholder="Fixed Max (LPA)"
                            />
                          </div>
                          {/* Variable */}
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={varMinLpa}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setVarMinLpa(value)
                                }
                              }}
                              className="w-full"
                              placeholder="Variable Min (LPA)"
                            />
                            <Input
                              value={varMaxLpa}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setVarMaxLpa(value)
                                }
                              }}
                              className="w-full"
                              placeholder="Variable Max (LPA)"
                            />
                          </div>
                        </div>

                        {app?.compensation && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span className="text-xs">Fixed:</span>
                              <span className="text-xs">
                                ₹{app.compensation.fixed_min_lpa || 'N/A'} - ₹{app.compensation.fixed_max_lpa || 'N/A'}
                              </span>
                            </div>
                            {(app.compensation.var_min_lpa || app.compensation.var_max_lpa) && (
                              <div className="flex justify-between">
                                <span className="text-xs">Variable:</span>
                                <span className="text-xs">
                                  ₹{app.compensation.var_min_lpa || 'N/A'} - ₹{app.compensation.var_max_lpa || 'N/A'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Source & Platform */}
                    <Card>
                      <CardContent className="space-y-3 bg-background/30 py-4">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Source & Platform
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <Select value={source} onValueChange={setSource}>
                              <SelectTrigger className="w-full">
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
                          </div>
                          <div>
                            <PlatformCombobox
                              value={selectedPlatform}
                              onChange={(p) => {
                                setSelectedPlatform(p)
                                setSelectedPlatformId(p?.id ?? null)
                              }}
                              placeholder="Select platform"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    

                    {/* Details */}
                    <Card>
                      <CardContent className="space-y-2 bg-background/30 py-4">
                        <Label className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Details
                        </Label>
                        
                        <div className="space-y-2 text-sm">
                          {app?.created_at && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Created</span>
                              <span>{formatDateIndian(new Date(app.created_at))}</span>
                            </div>
                          )}
                          {app?.last_activity_at && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Last Activity</span>
                              <span>{formatDateIndian(new Date(app.last_activity_at))}</span>
                            </div>
                          )}
                          {app?.created_at && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Days Active</span>
                              <span>{Math.ceil((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contacts placeholder */}
                    <Card>
                      <CardContent className="space-y-2 bg-background/30 py-4">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Contacts
                        </Label>
                        <div className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border rounded-md">
                          No contacts available
                        </div>
                      </CardContent>
                    </Card>
                    </ScrollArea>
                </motion.div>
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
                  className="flex items-center space-x-2 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex items-center justify-between w-full">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting || !role}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent"
                        />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the application and related data (contacts, conversations, interviews, history).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Stage Visualization Dialog */}
      <StageVisualization
        open={stageVisualizationOpen}
        onOpenChange={setStageVisualizationOpen}
        currentStage={stageStatus}
        onStageChange={(newStageId) => {
          // Map stage back to application status
          const statusMapping: Record<string, string> = {
            'applied_self': 'applied',
            'applied_referral': 'applied',
            'recruiter_outreach': 'applied',
            'hr_shortlist': 'applied',
            'hm_shortlist': 'applied',
            'dsa_r1': 'interview',
            'system_design': 'interview',
            'cultural_fit': 'interview',
            'technical_r2': 'interview',
            'final_round': 'interview',
            'offer': 'offered',
            'rejection': 'rejected'
          }
          
          const newStatus = statusMapping[newStageId] || newStageId
          updateStage(newStatus)
        }}
      />
    </Dialog >
  )
}
