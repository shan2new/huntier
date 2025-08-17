import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  Building2,
  Briefcase,
  Globe,
  Target,
  DollarSign,
  Info,
  Activity,
  MessageSquare,
  Calendar,
  Clock,
} from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import { 
  apiWithToken, 
  getApplication, 
  getCompanyById, 
  patchApplication,
  listPlatforms 
} from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { formatDateIndian } from '@/lib/utils'

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
  const [includeJobUrl, setIncludeJobUrl] = useState(false)
  const [platforms, setPlatforms] = useState<Array<Platform>>([])
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)

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
        platform_id: selectedPlatformId,
      })
      
      setApp({ ...app, ...updated })
      onUpdated?.(updated)
      handleClose()
    } catch (err) {
      setError('Failed to update application')
      console.error('Save error:', err)
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
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 border border-border rounded-xl bg-card">
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
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
                      <span className="truncate">{app.company.website_url.replace(/^https?:\/\//i, '')}</span>
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
          </DialogHeader>

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
            ) : (
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 h-full min-h-0">
                    <div className="p-6">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="space-y-6"
                      >
                        {/* Basic Application Details */}
                        <Card className="border border-border">
                          <CardContent className="p-6 space-y-6">
                            <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-4">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span>Application Details</span>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Role Title</Label>
                                <Input
                                  value={role}
                                  onChange={(e) => setRole(e.target.value)}
                                  placeholder="Senior Software Engineer"
                                  className="bg-background/50 border-border"
                                />
                              </div>
                              
                              {/* Job URL with toggle */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 justify-end">
                                  <Checkbox
                                    id="include-job-url"
                                    checked={includeJobUrl}
                                    onCheckedChange={(checked) => setIncludeJobUrl(!!checked)}
                                  />
                                  <Label htmlFor="include-job-url" className="text-xs">
                                    Include Job Link
                                  </Label>
                                </div>
                                
                                <AnimatePresence>
                                  {includeJobUrl && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3, ease: "easeOut" }}
                                      className="space-y-2"
                                    >
                                      <Label className="flex items-center gap-2 text-sm">
                                        <Globe className="h-4 w-4" />
                                        Job URL
                                      </Label>
                                      <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onBlur={(e) => setUrl(normalizeUrl(e.target.value))}
                                        placeholder="https://company.com/careers/job-123"
                                        className="bg-background/50 border-border"
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm">Platform</Label>
                                  <Select 
                                    value={selectedPlatformId ?? ''} 
                                    onValueChange={(v) => setSelectedPlatformId(v || null)}
                                  >
                                    <SelectTrigger className="bg-background/50 border-border">
                                      <SelectValue placeholder="Select platform (optional)" />
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
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm">Application Source</Label>
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
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>


                      </motion.div>
                    </div>
                  </ScrollArea>
                </div>

                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 border-l border-border bg-muted/10 overflow-y-auto hidden lg:block min-h-0">
                  <div className="p-4 space-y-4">
                    {/* Application Status */}
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Application Status</span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stage</span>
                            <Badge variant="outline" className="text-xs">
                              {app?.stage ? app.stage.replace('_', ' ') : 'Applied'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Source</span>
                            <Badge variant="secondary" className="text-xs">
                              {sourceOptions.find(s => s.value === source)?.label || 'Unknown'}
                            </Badge>
                          </div>
                          {selectedPlatformId && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Platform</span>
                              <span className="text-xs">
                                {platforms.find(p => p.id === selectedPlatformId)?.name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compensation */}
                    <Card className="border border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Compensation</span>
                        </div>
                        <div className="space-y-3">
                          {app?.compensation ? (
                            <>
                              {(app.compensation.fixed_min_lpa || app.compensation.fixed_max_lpa) && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Fixed (LPA)</span>
                                  <span className="text-xs">
                                    ₹{app.compensation.fixed_min_lpa || 'N/A'} - ₹{app.compensation.fixed_max_lpa || 'N/A'}
                                  </span>
                                </div>
                              )}
                              {(app.compensation.var_min_lpa || app.compensation.var_max_lpa) && (
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Variable (LPA)</span>
                                  <span className="text-xs">
                                    ₹{app.compensation.var_min_lpa || 'N/A'} - ₹{app.compensation.var_max_lpa || 'N/A'}
                                  </span>
                                </div>
                              )}
                              {app.compensation.note && (
                                <div className="space-y-1">
                                  <span className="text-sm text-muted-foreground">Notes</span>
                                  <p className="text-xs leading-relaxed">{app.compensation.note}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-muted-foreground">No compensation details available</div>
                          )}
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
                          {app?.created_at && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Days Active</span>
                              <span>{Math.ceil((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))}</span>
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
                  className="flex items-center space-x-2 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </motion.div>
              )}
              
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Delete
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
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
