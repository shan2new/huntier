import { motion } from "motion/react"
import { Building2, DollarSign, ExternalLink, Globe, Info, Loader2, Plus, Users } from "lucide-react"
import type { ApplicationListItem, Company, Platform } from "@/lib/api"
import type { StageObject } from "@/types/application"
import { cn, extractHostname, formatDateIndian } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ResponsiveModalFooter, ResponsiveModalHeader, ResponsiveModalTitle } from "@/components/ResponsiveModal"
import { CompanySearchCombobox } from "@/components/CompanySearchCombobox"
import { RoleSuggestionCombobox } from "@/components/RoleSuggestionCombobox"
import { ApplicationConversations } from "@/components/ApplicationConversations"
import { ApplicationNotes } from "@/components/ApplicationNotes"
import { PlatformCombobox } from "@/components/PlatformCombobox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

export type UpdateContact = {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  is_primary?: boolean
}

const sourceOptions = [
  { value: 'applied_self', label: 'Direct' },
  { value: 'applied_referral', label: 'Referral' },
  { value: 'recruiter_outreach', label: 'Recruiter' },
]

interface Props {
  app: ApplicationListItem | null
  stageStatus: StageObject
  stageBadge: React.ReactNode
  isInProgress: boolean

  // Header company change
  companySearchOpen: boolean
  setCompanySearchOpen: (v: boolean) => void
  onChangeCompany: (c: Company) => void

  // Role & job URL
  role: string
  setRole: (v: string) => void
  includeJobUrl: boolean
  setIncludeJobUrl: (v: boolean) => void
  url: string
  setUrl: (v: string) => void

  // Tabs
  activeTab: 'notes' | 'conversations'
  setActiveTab: (v: 'notes' | 'conversations') => void

  // Compensation
  fixedMinLpa: string
  fixedMaxLpa: string
  varMinLpa: string
  varMaxLpa: string
  setFixedMinLpa: (v: string) => void
  setFixedMaxLpa: (v: string) => void
  setVarMinLpa: (v: string) => void
  setVarMaxLpa: (v: string) => void

  // Source & Platform
  source: string
  setSource: (v: string) => void
  selectedPlatform: Platform | null
  onPlatformChange: (p: Platform | null) => void

  // Contacts
  contactsLoading: boolean
  contacts: Array<UpdateContact>
  onAddContactClick?: () => void

  // Footer
  error: string
  isSubmitting: boolean
  onClose: () => void
  onSave: () => void
  onAskDelete: () => void
  onStageVizOpen: () => void
}

export function UpdateApplicationModalDesktop(props: Props) {
  const {
    app,
    stageBadge,
    isInProgress,
    companySearchOpen,
    setCompanySearchOpen,
    onChangeCompany,
    role,
    setRole,
    includeJobUrl,
    setIncludeJobUrl,
    url,
    setUrl,
    activeTab,
    setActiveTab,
    fixedMinLpa,
    fixedMaxLpa,
    varMinLpa,
    varMaxLpa,
    setFixedMinLpa,
    setFixedMaxLpa,
    setVarMinLpa,
    setVarMaxLpa,
    source,
    setSource,
    selectedPlatform,
    onPlatformChange,
    contactsLoading,
    contacts,
    onAddContactClick,
    error,
    isSubmitting,
    onClose,
    onSave,
    onAskDelete,
    onStageVizOpen,
  } = props

  return (
    <div className="flex flex-col h-full">
      <ResponsiveModalHeader className="px-2 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {app?.company?.logo_url ? (
              <img src={app.company.logo_url} alt={app.company.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <ResponsiveModalTitle className="text-md font-semibold tracking-tight truncate text-left">
                {app?.role || 'Application'}
              </ResponsiveModalTitle>
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
                    <a className="truncate inline-flex items-center gap-1 text-primary" href={app.company.website_url} target="_blank" rel="noreferrer">
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
                  onClick={onStageVizOpen}
                >
                  {stageBadge}
                </Badge>
              </div>

              <CompanySearchCombobox
                value={app.company || null}
                onChange={(c) => c && onChangeCompany(c)}
                open={companySearchOpen}
                onOpenChange={setCompanySearchOpen}
                variant="dialog"
                triggerAsChild={<Button variant="outline" size="sm" className="h-8 px-3">Change</Button>}
              />
            </div>
          )}
        </div>
      </ResponsiveModalHeader>

      <div className="grid grid-cols-5 gap-4">
        {/* Left - main content */}
        <div className="col-span-3 px-6 pb-20 pt-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-2 py-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
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
                    <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Software Engineer" className="w-full bg-background border-border" />
                  )}
                </div>

                {/* Job URL toggle */}
                <div className="space-y-2 w-full">
                  <div className="flex items-center space-x-2 w-full justify-end">
                    <Checkbox id="include-job-url" checked={includeJobUrl} onCheckedChange={(checked) => setIncludeJobUrl(!!checked)} />
                    <Label htmlFor="include-job-url" className="text-sm font-normal cursor-pointer">
                      Include Job URL
                    </Label>
                  </div>
                  {includeJobUrl && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com/careers/job-123" className="w-full" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes & Conversations */}
            <Card className="mt-6">
              <CardContent className="p-0">
                <div className="space-y-3">
                  <div className="flex gap-2 border-b px-2 pt-0">
                    <button onClick={() => setActiveTab('notes')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'notes' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Notes{activeTab === 'notes' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                    <button onClick={() => setActiveTab('conversations')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'conversations' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Conversations{activeTab === 'conversations' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                  </div>
                  <div className="px-2 pb-4">
                    {activeTab === 'notes' ? (
                      <ApplicationNotes applicationId={app?.id || ''} />
                    ) : (
                      <ApplicationConversations applicationId={app?.id || ''} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right - details */}
        <div className="col-span-2 border-l border-border px-6 pb-20">
          <div className="space-y-4">
            {/* Compensation */}
            <Card>
              <CardContent className="space-y-3 py-4">
                <Label className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Compensation</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Fixed (LPA)</Label>
                      {fixedMinLpa && fixedMaxLpa && (<span className="text-xs text-muted-foreground">₹{fixedMinLpa || '0'} - ₹{fixedMaxLpa}</span>)}
                    </div>
                    <Input value={fixedMinLpa && fixedMaxLpa ? `${fixedMinLpa}-${fixedMaxLpa}` : ''} onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*(-\d*\.?\d*)?$/.test(value)) {
                        const parts = value.split('-')
                        if (parts.length === 1) { setFixedMinLpa(parts[0]); setFixedMaxLpa(parts[0]) } else if (parts.length === 2) { setFixedMinLpa(parts[0]); setFixedMaxLpa(parts[1]) }
                      }
                    }} className="w-full" placeholder="15-25" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Variable (LPA)</Label>
                      {varMinLpa && varMaxLpa && (<span className="text-xs text-muted-foreground">₹{varMinLpa || '0'} - ₹{varMaxLpa}</span>)}
                    </div>
                    <Input value={varMinLpa && varMaxLpa ? `${varMinLpa}-${varMaxLpa}` : ''} onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*(-\d*\.?\d*)?$/.test(value)) {
                        const parts = value.split('-')
                        if (parts.length === 1) { setVarMinLpa(parts[0]); setVarMaxLpa(parts[0]) } else if (parts.length === 2) { setVarMinLpa(parts[0]); setVarMaxLpa(parts[1]) }
                      }
                    }} className="w-full" placeholder="5-10" />
                  </div>
                </div>

                {app?.compensation && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="text-xs">Compensation:</span>
                      <span className="text-xs">
                        {(() => {
                          const comp = app.compensation
                          const fixed = comp.fixed_min_lpa || comp.fixed_max_lpa
                          const variable = comp.var_min_lpa || comp.var_max_lpa
                          if (!fixed && !variable) return 'Not specified'
                          const formatValue = (val: string | null | undefined) => {
                            if (!val || val === 'N/A') return val || 'N/A'
                            return val.endsWith('.00') ? val.slice(0, -3) : val
                          }
                          if (fixed && comp.fixed_min_lpa === comp.fixed_max_lpa) {
                            return `₹${formatValue(comp.fixed_min_lpa)} LPA`
                          }
                          if (fixed) {
                            const min = formatValue(comp.fixed_min_lpa)
                            const max = formatValue(comp.fixed_max_lpa)
                            return `₹${min}-${max} LPA`
                          }
                          if (variable) {
                            const amount = formatValue(comp.var_min_lpa || comp.var_max_lpa)
                            return `₹${amount} LPA (Variable)`
                          }
                          return 'Not specified'
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source & Platform */}
            <Card>
              <CardContent className="space-y-3 py-4">
                <Label className="flex items-center gap-2"><Globe className="h-4 w-4" />Source & Platform</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>How did you apply?</SelectLabel>
                          {sourceOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <PlatformCombobox value={selectedPlatform} onChange={onPlatformChange} placeholder="platform" className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="space-y-2 py-4">
                <Label className="flex items-center gap-2"><Info className="h-4 w-4" />Details</Label>
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

            {/* Contacts */}
            <Card>
              <CardContent className="space-y-3 py-4">
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Contacts</Label>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-input/70">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{contact.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-auto font-normal">{contact.role}</Badge>
                            {contact.is_primary && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto font-normal">Primary</Badge>)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-3 px-4 border border-dashed border-border rounded-md bg-muted/20 dark:bg-muted/10">
                        No contacts available
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={onAddContactClick} className="w-full h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" />Add Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ResponsiveModalFooter className="px-6 py-3 bg-background border-t border-border">
        <div className="flex flex-col gap-3">
          {error && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              {/* icon kept minimal to avoid extra imports */}
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center justify-between w-full">
            <Button variant="destructive" onClick={onAskDelete} disabled={isSubmitting}>Delete</Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Close</Button>
              <Button onClick={onSave} disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveModalFooter>
    </div>
  )
}
