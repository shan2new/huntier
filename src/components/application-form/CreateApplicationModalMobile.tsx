import { motion } from "motion/react"
import { Building2, DollarSign, ExternalLink, Plus, Target, Trash2, Users } from "lucide-react"
import type { Company, Platform } from "@/lib/api"
import { cn, extractHostname } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveModalFooter, ResponsiveModalHeader, ResponsiveModalTitle } from "@/components/ResponsiveModal"
import { CompanySearchCombobox } from "@/components/CompanySearchCombobox"
import { RoleSuggestionCombobox } from "@/components/RoleSuggestionCombobox"
import { ApplicationNotes } from "@/components/ApplicationNotes"
import { ApplicationConversations } from "@/components/ApplicationConversations"
import { Badge } from "@/components/ui/badge"
import { PlatformCombobox } from "@/components/PlatformCombobox"
import { JobUrlToggleField } from "@/components/application-form/JobUrlToggleField"

type Contact = {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  isThirdParty: boolean
  description: string
  avatar?: string
  is_primary?: boolean
}

interface Props {
  company: Company | null
  setCompany: (c: Company | null) => void
  companySearchOpen: boolean
  setCompanySearchOpen: (v: boolean) => void

  role: string
  setRole: (v: string) => void

  includeJobUrl: boolean
  setIncludeJobUrl: (v: boolean) => void
  jobUrl: string
  setJobUrl: (v: string) => void

  fixedMinLpa: string
  fixedMaxLpa: string
  setFixedMinLpa: (v: string) => void
  setFixedMaxLpa: (v: string) => void
  varMinLpa: string
  varMaxLpa: string
  setVarMinLpa: (v: string) => void
  setVarMaxLpa: (v: string) => void

  source: string
  setSource: (v: string) => void
  selectedPlatform: Platform | null
  setSelectedPlatform: (p: Platform | null) => void

  contacts: Array<Contact>
  setContactModalOpen: (v: boolean) => void
  setEditingContact: (c: Contact | null) => void
  handleDeleteContact: (id: string) => void

  pendingNotes: Array<string>
  addPendingNote: (content: string, updatedNotes?: Array<string>) => void

  activeTab: 'notes' | 'conversations'
  setActiveTab: (v: 'notes' | 'conversations') => void

  isSubmitting: boolean
  error: string
  handleSubmit: () => void
  handleClose: () => void
}

const sourceOptions = [
  { value: 'applied_self', label: 'Direct' },
  { value: 'applied_referral', label: 'Referral' },
  { value: 'recruiter_outreach', label: 'Recruiter' },
]

export function CreateApplicationModalMobile(props: Props) {
  const {
    company,
    setCompany,
    companySearchOpen,
    setCompanySearchOpen,
    role,
    setRole,
    includeJobUrl,
    setIncludeJobUrl,
    jobUrl,
    setJobUrl,
    fixedMinLpa,
    fixedMaxLpa,
    setFixedMinLpa,
    setFixedMaxLpa,
    varMinLpa,
    varMaxLpa,
    setVarMinLpa,
    setVarMaxLpa,
    source,
    setSource,
    selectedPlatform,
    setSelectedPlatform,
    contacts,
    setContactModalOpen,
    setEditingContact,
    handleDeleteContact,
    pendingNotes,
    addPendingNote,
    activeTab,
    setActiveTab,
    isSubmitting,
    handleSubmit,
    handleClose,
  } = props

  return (
    <div className="flex flex-col h-full">
      <ResponsiveModalHeader className="px-4 py-4 bg-background border-b border-border">
        <div className="flex items-center justify-between gap-3">
          {company ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <ResponsiveModalTitle className="text-base font-semibold tracking-tight truncate text-left">
                    {role || 'New Application'}
                  </ResponsiveModalTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                    <span className="truncate">{company.name}</span>
                    {company.hq && company.hq.city && company.hq.country && (
                      <>
                        <span>•</span>
                        <span>{company.hq.city}, {company.hq.country}</span>
                      </>
                    )}
                    {company.website_url && (
                      <>
                        <span>•</span>
                        <a className="truncate inline-flex items-center gap-1 text-primary" href={company.website_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3 w-3" /> {extractHostname(company.website_url)}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <CompanySearchCombobox
                value={company}
                onChange={(c) => { setCompany(c); setCompanySearchOpen(false) }}
                open={companySearchOpen}
                onOpenChange={setCompanySearchOpen}
                variant="dialog"
                triggerAsChild={
                  <Button variant="outline" size="sm" className="h-8 px-3">Change</Button>
                }
              />
            </>
          ) : (
            <ResponsiveModalTitle className="text-base font-semibold tracking-tight">Create Application</ResponsiveModalTitle>
          )}
        </div>
      </ResponsiveModalHeader>

      <div className="flex-1 min-h-0 pb-20">
        {!company ? (
          <div className="flex items-center justify-center h-full p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-full max-w-md space-y-4">
              <div className="text-center space-y-2">
                <Building2 className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-medium">Select Company</h3>
                <p className="text-sm text-muted-foreground">Start by searching for the company you're applying to</p>
              </div>
              <CompanySearchCombobox value={company} onChange={setCompany} placeholder="Search" />
            </motion.div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
              {/* Role */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Role
                </Label>
                {company.id ? (
                  <RoleSuggestionCombobox companyId={company.id} onChoose={(s) => setRole(s.role)} showAsInput inputValue={role} onInputValueChange={setRole} placeholder="e.g. Senior Software Engineer" className="w-full" />
                ) : (
                  <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Software Engineer" className="w-full bg-background border-border" />
                )}
              </div>

              {/* Job URL */}
              <JobUrlToggleField
                include={includeJobUrl}
                onIncludeChange={setIncludeJobUrl}
                url={jobUrl}
                onUrlChange={setJobUrl}
              />

              {/* Notes & Conversations */}
              <Card className="mt-2">
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex gap-2 border-b px-4 pt-4">
                      <button onClick={() => setActiveTab('notes')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'notes' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Notes{activeTab === 'notes' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                      <button onClick={() => setActiveTab('conversations')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'conversations' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Conversations{activeTab === 'conversations' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                    </div>
                    <div className="px-4 pb-4">
                      {activeTab === 'notes' ? (
                        <ApplicationNotes isCreating pendingNotes={pendingNotes} onAddPendingNote={addPendingNote} />
                      ) : (
                        <ApplicationConversations isCreating className="h-[400px]" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compensation */}
              <Card>
                <CardContent className="space-y-3 pt-3">
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
                </CardContent>
              </Card>

              {/* Source & Platform */}
              <Card>
                <CardContent className="space-y-3 pt-3">
                  <Label className="flex items-center gap-2"><Target className="h-4 w-4" />Source & Platform</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>How did you apply?</SelectLabel>
                            {sourceOptions.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <PlatformCombobox value={selectedPlatform} onChange={setSelectedPlatform} placeholder="platform" className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card>
                <CardContent className="space-y-3 pt-3">
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Contacts</Label>
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-input/70">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => { setEditingContact(contact); setContactModalOpen(true) }}>
                          <div className="text-xs font-medium truncate">{contact.name}</div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{contact.role}</Badge>
                            {contact.is_primary && (<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Primary</Badge>)}
                            {contact.isThirdParty && (<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">3rd Party</Badge>)}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id) }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setContactModalOpen(true)} className="w-full h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" />Add Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        )}
      </div>

      <ResponsiveModalFooter className="bg-background border-t border-border fixed bottom-0 left-0 right-0 px-4 py-3 z-40">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !role || !company} className="flex-1">
            {isSubmitting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3 h-3 mr-1 rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
        </div>
      </ResponsiveModalFooter>
    </div>
  )
}
