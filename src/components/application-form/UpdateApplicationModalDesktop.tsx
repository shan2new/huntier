import { motion } from "motion/react"
import { Building2, ExternalLink, Globe, HelpCircle, Info, Plus, Users } from "lucide-react"
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
import { CompensationSection } from "@/components/CompensationSection"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlatformCombobox } from "@/components/PlatformCombobox"
import { SourceCombobox } from "@/components/SourceCombobox"

export type UpdateContact = {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  is_primary?: boolean
}

// deprecated: source options moved to SourceCombobox

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
  onEditContact?: (c: UpdateContact) => void

  // Footer
  error: string
  isSubmitting: boolean
  onClose: () => void
  onSave: () => void
  onAskDelete: () => void
  onStageVizOpen: () => void
  onActivity?: (occurredAtIso: string) => void
  onArchiveToggle?: () => void
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
    onEditContact,
    error,
    isSubmitting,
    onClose,
    onSave,
    onAskDelete,
    onStageVizOpen,
    onArchiveToggle,
  } = props

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-background/95 backdrop-blur-sm border border-border/60 shadow-2xl" >
        <ResponsiveModalHeader className="px-6 py-4 border-b border-border/60 bg-card/90 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {app?.company?.logo_url ? (
              <img src={app.company.logo_url} alt={app.company.name} className="w-10 h-10 rounded-xl object-cover border border-border/60 shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center border border-border/60">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <ResponsiveModalTitle className="text-md font-semibold tracking-tight truncate text-left text-card-foreground">
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
                    <a className="truncate inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors" href={app.company.website_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3" /> {extractHostname(app.company.website_url)}
                    </a>
                  </>
                )}
                {app && ((app as any).progress_updated_at || app.last_activity_at) ? (
                  <>
                    <span>•</span>
                    <span>Updated {formatDateIndian(new Date(((app as any).progress_updated_at || app.last_activity_at) as string))}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {app && (
            <div className="flex items-center gap-2">
              {isInProgress && (
                <div className="relative mr-1 h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer rounded-full px-2.5 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors border-border/60"
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
                triggerAsChild={<Button variant="outline" size="sm" className="h-8 px-3 border-border/60 hover:bg-accent hover:text-accent-foreground">Change</Button>}
              />
            </div>
          )}
        </div>
      </ResponsiveModalHeader>

      <div className="relative grid grid-cols-5 gap-0 rounded-2xl">
        <div className="absolute inset-y-0 left-[60%] -translate-x-1/2 w-px bg-border/60 pointer-events-none" aria-hidden="true" />
        {/* Left - main content */}
        <div className="col-span-3 px-6 pb-20 pt-4">
          <div className="space-y-4">
            <Card className="bg-card/80 border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="space-y-2 py-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-card-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
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
                    <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Software Engineer" className="w-full bg-background border-border/60 focus:border-primary/60 transition-colors" />
                  )}
                </div>

                {/* Job URL toggle */}
                <div className="space-y-2 w-full">
                  <div className="flex items-center space-x-2 w-full justify-end">
                    <Checkbox id="include-job-url" checked={includeJobUrl} onCheckedChange={(checked) => setIncludeJobUrl(!!checked)} />
                    <Label htmlFor="include-job-url" className="text-sm font-normal cursor-pointer text-card-foreground">
                      Include Job URL
                    </Label>
                  </div>
                  {includeJobUrl && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://company.com/careers/job-123" className="w-full bg-background border-border/60 focus:border-primary/60 transition-colors" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes & Conversations */}
            <Card className="mt-6 bg-card/80 border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="space-y-3">
                  <div className="flex gap-2 border-b border-border/60 px-2 pt-0">
                    <button onClick={() => setActiveTab('notes')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'notes' ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground")}>Notes{activeTab === 'notes' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                    <button onClick={() => setActiveTab('conversations')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'conversations' ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground")}>Conversations{activeTab === 'conversations' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                  </div>
                  <div className="px-2 py-2">
                    {activeTab === 'notes' ? (
                      <ApplicationNotes applicationId={app?.id || ''} />
                    ) : (
                      <ApplicationConversations 
                        applicationId={app?.id || ''}
                        onActivity={props.onActivity}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right - details */}
        <div className="col-span-2 px-6 pb-20 pt-4">
          <div className="space-y-4">
            {/* Compensation */}
            <CompensationSection
              fixedMinLpa={fixedMinLpa}
              fixedMaxLpa={fixedMaxLpa}
              varMinLpa={varMinLpa}
              varMaxLpa={varMaxLpa}
              setFixedMinLpa={setFixedMinLpa}
              setFixedMaxLpa={setFixedMaxLpa}
              setVarMinLpa={setVarMinLpa}
              setVarMaxLpa={setVarMaxLpa}
              variableEnabled={!!(varMinLpa || varMaxLpa)}
              setVariableEnabled={(v) => { if (!v) { setVarMinLpa(''); setVarMaxLpa('') } }}
            />

            {/* Source & Platform */}
            <Card className="bg-card/80 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-2 text-card-foreground"><Globe className="h-4 w-4 text-primary" />Source & Platform</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help hover:text-primary/80 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-48 text-xs">How you discovered and applied for this role</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SourceCombobox value={source} onChange={setSource} className="w-full h-10" variant="popover" />
                  <div>
                    <PlatformCombobox 
                      value={selectedPlatform} 
                      onChange={onPlatformChange} 
                      placeholder="Platform" 
                      className="w-full h-10" 
                      variant="popover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="bg-card/80 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="space-y-2 py-4">
                <Label className="flex items-center gap-2 text-card-foreground"><Info className="h-4 w-4 text-primary" />Details</Label>
                <div className="space-y-2 text-sm">
                  {app?.created_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Created</span>
                      <span className="text-card-foreground">{formatDateIndian(new Date(app.created_at))}</span>
                    </div>
                  )}
                  {app?.last_activity_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span className="text-card-foreground">{formatDateIndian(new Date(app.last_activity_at))}</span>
                    </div>
                  )}
                  {app?.created_at && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Days Active</span>
                      <span className="text-card-foreground">{Math.ceil((Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card className="bg-card/80 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center gap-2">
                  <Label className="flex items-center gap-2 text-card-foreground"><Users className="h-4 w-4 text-primary" />Contacts</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help hover:text-primary/80 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-48 text-xs">People you've interacted with during the application process</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((contact) => (
                        <button
                          key={contact.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-md border border-border/60 bg-input/50 hover:bg-accent/50 hover:border-border/80 cursor-pointer transition-all duration-200"
                          onClick={() => onEditContact && onEditContact(contact)}
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 ring-2 ring-primary/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary">{contact.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs font-medium truncate text-card-foreground">
                              <span className="truncate capitalize">{contact.name}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate capitalize">{contact.role}</div>
                          </div>
                          {contact.is_primary && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                    {contacts.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-3 px-4 border border-dashed border-border/60 rounded-md bg-muted/10 hover:bg-muted/20 transition-colors">
                        No contacts available
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={onAddContactClick} className="w-full h-8 text-xs border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Plus className="h-3 w-3 mr-1" />Add Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ResponsiveModalFooter className="px-6 py-3 bg-card/90 backdrop-blur-sm border-t border-border/60 rounded-b-2xl">
        {error && (
          <div className="flex items-center gap-2 mb-3 p-2 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <div className="w-1 h-1 rounded-full bg-destructive" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onAskDelete} 
              disabled={isSubmitting}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive/90 transition-colors"
            >
              Delete
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose} 
              disabled={isSubmitting}
              className="border-border/60 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </Button>
            {app && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onArchiveToggle}
                disabled={isSubmitting}
                className="border-border/60"
              >
                {(app as any).is_archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
            <Button 
              onClick={onSave} 
              disabled={isSubmitting} 
              size="sm"
              className="min-w-[80px] bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </ResponsiveModalFooter>
      </div>
    </TooltipProvider>
  )
}
