import { useRef, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { motion } from "motion/react"
import { Building2, ExternalLink, HelpCircle, ImagePlus, Loader2, Plus, Target, Trash2, Users, X } from "lucide-react"
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
import { CompensationSection } from "@/components/CompensationSection"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlatformCombobox } from "@/components/PlatformCombobox"
import { JobUrlToggleField } from "@/components/application-form/JobUrlToggleField"
import { extractApplicationDraftFromImagesWithRefresh, getApplicationDraftWithRefresh } from "@/lib/api"

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
  const { getToken } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [jdFiles, setJdFiles] = useState<Array<File>>([])
  const [jdPreviews, setJdPreviews] = useState<Array<string>>([])
  const [, setDraftId] = useState<string | null>(null)

  async function handleExtract(files: Array<File>) {
    if (!files.length) return
    setAiLoading(true)
    setAiError("")
    try {
      const res = await extractApplicationDraftFromImagesWithRefresh(async () => (await getToken()) || "", files)
      setDraftId(res.draft_id)
      const draft: any = await getApplicationDraftWithRefresh(async () => (await getToken()) || "", res.draft_id)
      if (draft?.role) setRole(draft.role)
      if (draft?.job_url) { setIncludeJobUrl(true); setJobUrl(draft.job_url) }
      if (draft?.compensation) {
        const fxMin = draft.compensation.fixed_min_lpa ?? null
        const fxMax = draft.compensation.fixed_max_lpa ?? null
        const vrMin = draft.compensation.var_min_lpa ?? null
        const vrMax = draft.compensation.var_max_lpa ?? null

        const toLpa = (v: any): number | null => {
          if (v == null) return null
          const n = Number(v)
          if (!isFinite(n)) return null
          if (n >= 1000) return 30
          if (n < 10 || n > 90) return 30
          return n
        }

        let nMin = toLpa(fxMin)
        let nMax = toLpa(fxMax)
        const nVarMin = toLpa(vrMin)
        const nVarMax = toLpa(vrMax)

        if (nMin != null && nMax == null) {
          nMax = Math.min(90, nMin + 5)
        } else if (nMax != null && nMin == null) {
          nMin = Math.max(10, nMax - 5)
        }
        if (nMin != null) setFixedMinLpa(String(nMin))
        if (nMax != null) setFixedMaxLpa(String(nMax))
        if (nVarMin != null) setVarMinLpa(String(nVarMin))
        if (nVarMax != null) setVarMaxLpa(String(nVarMax))
      }
      if (Array.isArray(draft?.notes) && draft.notes.length) {
        draft.notes.slice(0, 3).forEach((n: string) => addPendingNote(n))
      }
      if (!company && draft?.company) setCompany(draft.company)
      if (!selectedPlatform && draft?.platform) setSelectedPlatform(draft.platform)
    } catch {
      setAiError("Failed to extract from images")
    } finally {
      setAiLoading(false)
    }
  }

  function onFilesAdded(newFiles: Array<File>) {
    const imgs = newFiles.filter((f) => f.type.startsWith('image/'))
    if (!imgs.length) return
    const next = [...jdFiles, ...imgs]
    setJdFiles(next)
    const urls = imgs.map((f) => URL.createObjectURL(f))
    setJdPreviews((prev) => [...prev, ...urls])
    handleExtract(imgs)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <ResponsiveModalHeader className="px-4 py-4 bg-background border-b border-border">
        <div className="flex items-center justify-between gap-3">
          {company ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-xl object-cover border border-border/60" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center border border-border/60">
                    <Building2 className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <ResponsiveModalTitle className="text-base font-semibold tracking-tight truncate text-left">
                    Create Application
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
                className="max-w-full"
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

              <div
                className="mt-2 p-4 rounded-lg border border-dashed border-border text-center bg-muted/20 hover:bg-muted/30 transition-colors"
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => { e.preventDefault(); onFilesAdded(Array.from(e.dataTransfer.files)) }}
                onPaste={(e) => {
                  const files = Array.from(e.clipboardData.files)
                  if (files.length) onFilesAdded(files)
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm font-medium">Or upload/paste JD screenshots</div>
                  <div className="text-xs text-muted-foreground">Drop images here, tap to upload, or paste from clipboard</div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={aiLoading}>
                    {aiLoading ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Reading JD...</span>) : 'Choose Images'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFilesAdded(Array.from(e.target.files || []))} />
                </div>
                {jdPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {jdPreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} className="w-full h-20 object-cover rounded-md border border-border" />
                        <button
                          className="absolute -top-1.5 -right-1.5 bg-background/90 border border-border rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            URL.revokeObjectURL(jdPreviews[idx])
                            setJdPreviews((prev) => prev.filter((_, i) => i !== idx))
                            setJdFiles((prev) => prev.filter((_, i) => i !== idx))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>)
                    )}
                  </div>
                )}
                {aiError && (
                  <div className="text-xs text-destructive mt-2">{aiError}</div>
                )}
              </div>
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
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {company.id ? (
                      <RoleSuggestionCombobox companyId={company.id} onChoose={(s) => setRole(s.role)} showAsInput inputValue={role} onInputValueChange={setRole} placeholder="e.g. Senior Software Engineer" className="w-full" />
                    ) : (
                      <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Software Engineer" className="w-full bg-background border-border" />
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    if (!files.length) return
                    setAiLoading(true)
                    setAiError("")
                    try {
                      const res = await extractApplicationDraftFromImagesWithRefresh(async () => (await getToken()) || "", files)
                      const draft: any = await getApplicationDraftWithRefresh(async () => (await getToken()) || "", res.draft_id)
                      if (draft?.role) setRole(draft.role)
                      if (draft?.job_url) setJobUrl(draft.job_url)
                      if (draft?.compensation) {
                        const fxMin = draft.compensation.fixed_min_lpa ?? null
                        const fxMax = draft.compensation.fixed_max_lpa ?? null
                        const vrMin = draft.compensation.var_min_lpa ?? null
                        const vrMax = draft.compensation.var_max_lpa ?? null

                        const toLpa = (v: any): number | null => {
                          if (v == null) return null
                          const n = Number(v)
                          if (!isFinite(n)) return null
                          if (n >= 1000) return 30
                          if (n < 10 || n > 90) return 30
                          return n
                        }

                        let nMin = toLpa(fxMin)
                        let nMax = toLpa(fxMax)
                        const nVarMin = toLpa(vrMin)
                        const nVarMax = toLpa(vrMax)
                        if (nMin != null && nMax == null) nMax = Math.min(90, nMin + 5)
                        else if (nMax != null && nMin == null) nMin = Math.max(10, nMax - 5)
                        if (nMin != null) setFixedMinLpa(String(nMin))
                        if (nMax != null) setFixedMaxLpa(String(nMax))
                        if (nVarMin != null) setVarMinLpa(String(nVarMin))
                        if (nVarMax != null) setVarMaxLpa(String(nVarMax))
                      }
                      if (Array.isArray(draft?.notes) && draft.notes.length) {
                        draft.notes.slice(0, 3).forEach((n: string) => addPendingNote(n))
                      }
                    } catch (err) {
                      setAiError("Failed to extract from images")
                    } finally {
                      setAiLoading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }
                  }} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={aiLoading}>
                    {aiLoading ? "Reading JD..." : "Upload JD"}
                  </Button>
                </div>
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
                    <div className="flex gap-2 border-b border-border/60 px-4 pt-4">
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

              {aiError && (
                <div className="text-xs text-destructive">{aiError}</div>
              )}

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
                variant="compact"
              />

              {/* Source & Platform */}
              <Card>
                <CardContent className="space-y-3 pt-3">
                  <div className="flex items-center gap-2">
                    <Label className="flex items-center gap-2"><Target className="h-4 w-4" />Source & Platform</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-48 text-xs">How you discovered and applied for this role</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Contacts</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-48 text-xs">People you've interacted with during the application process</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
    </TooltipProvider>
  )
}
