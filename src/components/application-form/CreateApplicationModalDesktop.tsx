import { motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { Building2, ExternalLink, HelpCircle, ImagePlus, Loader2, Target, Trash2, Users, X } from "lucide-react"
import type { Company, Platform } from "@/lib/api"
import { cn, extractHostname } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SourceCombobox } from "@/components/SourceCombobox"
import { PlatformCombobox } from "@/components/PlatformCombobox"
import { ResponsiveModalFooter, ResponsiveModalHeader, ResponsiveModalTitle } from "@/components/ResponsiveModal"
import { ApplicationNotes } from "@/components/ApplicationNotes"
import { ApplicationConversations } from "@/components/ApplicationConversations"
import { CompanySearchCombobox } from "@/components/CompanySearchCombobox"
import { CompensationSection } from "@/components/CompensationSection"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RoleField } from "@/components/application-form/RoleField"
import { JobUrlToggleField } from "@/components/application-form/JobUrlToggleField"
import { extractApplicationDraftFromImagesWithRefresh, getApplicationDraftWithRefresh } from "@/lib/api"

// Keep local Contact shape to match parent state
export type Contact = {
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

// deprecated: left for backwards compatibility in case of future revert
// deprecated: source options moved to SourceCombobox
// (intentionally empty and unused)

export function CreateApplicationModalDesktop(props: Props) {
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
    error,
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

  // Cleanup object URLs
  useEffect(() => {
    return () => { jdPreviews.forEach((u) => URL.revokeObjectURL(u)) }
  }, [jdPreviews])

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

        // Normalize to LPA; treat large rupee values like 1200000 as 12 and clamp to [10, 90]
        const toLpa = (v: any): number | null => {
          if (v == null) return null
          const n = Number(v)
          if (!isFinite(n)) return null
          // If value looks like rupees (e.g., 1200000), prefer a safe default rather than converting
          if (n >= 1000) return 30
          if (n < 10 || n > 90) return 30 // fallback sensible default
          return n
        }

        let nMin = toLpa(fxMin)
        let nMax = toLpa(fxMax)
        const nVarMin = toLpa(vrMin)
        const nVarMax = toLpa(vrMax)

        // If only one bound is present, guess a tight range within [10,90]
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
    } catch (err) {
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
    // Auto-extract for seamless UX
    handleExtract(imgs)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col">
        <ResponsiveModalHeader className="px-6 py-4 border-b border-white/10 bg-neutral-950/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          {company ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-10 h-10 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <ResponsiveModalTitle className="text-lg font-semibold tracking-tight truncate">
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
                triggerAsChild={<Button variant="outline" size="sm" className="h-8 px-3">Change</Button>}
              />
            </>
          ) : (
            <ResponsiveModalTitle className="text-lg font-semibold tracking-tight">Create Application</ResponsiveModalTitle>
          )}
        </div>
        </ResponsiveModalHeader>

        {company ? (
          <div className="p-6 relative grid grid-cols-5 gap-6">
            <div className="absolute inset-y-0 left-[60%] -translate-x-1/2 w-px bg-white/10 pointer-events-none" aria-hidden="true" />

            {/* Left Column */}
            <div className="col-span-3 pr-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <RoleField companyId={company.id} role={role} onRoleChange={setRole} />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFilesAdded(Array.from(e.target.files || []))} />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={aiLoading}>
                  {aiLoading ? "Reading JD..." : "Upload JD Image"}
                </Button>
              </div>
              <JobUrlToggleField include={includeJobUrl} onIncludeChange={setIncludeJobUrl} url={jobUrl} onUrlChange={setJobUrl} />

              <Card className="mt-2 bg-neutral-900/80 border-white/10">
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex gap-2 border-b border-white/10 px-6 pt-6">
                      <button onClick={() => setActiveTab('notes')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'notes' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Notes{activeTab === 'notes' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                      <button onClick={() => setActiveTab('conversations')} className={cn("px-3 py-2 text-sm font-medium transition-colors relative", activeTab === 'conversations' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>Conversations{activeTab === 'conversations' && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />)}</button>
                    </div>
                    <div className="px-6 pb-6">
                      {activeTab === 'notes' ? (
                        <ApplicationNotes isCreating pendingNotes={pendingNotes} onAddPendingNote={addPendingNote} />
                      ) : (
                        <ApplicationConversations isCreating className="h-[400px]" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="col-span-2 pl-6 space-y-4">
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
              />

              {/* Source & Platform */}
              <Card className="bg-neutral-900/80 border-white/10">
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
                    <SourceCombobox value={source} onChange={setSource} className="w-full h-10" variant="popover" />
                    <div>
                      <PlatformCombobox value={selectedPlatform} onChange={setSelectedPlatform} placeholder="platform" className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card className="bg-neutral-900/80 border-white/10">
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
                      <div key={contact.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-input/70 hover:bg-background/80 transition-colors group">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">{contact.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingContact(contact); setContactModalOpen(true) }}>
                          <div className="text-xs font-medium truncate">{contact.name}</div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{contact.role}</Badge>
                            {contact.is_primary && (<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Primary</Badge>)}
                            {contact.isThirdParty && (<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">3rd Party</Badge>)}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id) }}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => setContactModalOpen(true)} className="w-full h-8 text-xs">Add Contact</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center space-y-2">
                <Building2 className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-lg font-medium">Select Company</h3>
                <p className="text-sm text-muted-foreground">Start by searching for the company you're applying to</p>
              </div>
              <CompanySearchCombobox value={company} onChange={setCompany} placeholder="Search" />
              <div className="relative">
                <div
                  className="mt-4 p-6 rounded-xl border border-dashed border-border text-center bg-muted/20 hover:bg-muted/30 transition-colors"
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => { e.preventDefault(); onFilesAdded(Array.from(e.dataTransfer.files)) }}
                  onPaste={(e) => {
                    const files = Array.from(e.clipboardData.files)
                    if (files.length > 0) onFilesAdded(files)
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    <div className="text-sm font-medium">Or upload/paste JD screenshots</div>
                    <div className="text-xs text-muted-foreground">Drop images here, click to upload, or press Cmd/Ctrl+V to paste</div>
                    <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={aiLoading}>
                      {aiLoading ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Reading JD...</span>) : 'Choose Images'}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFilesAdded(Array.from(e.target.files || []))} />
                  </div>
                </div>
                {jdPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
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
                      </div>
                    ))}
                  </div>
                )}
                {aiError && (
                  <div className="text-xs text-destructive mt-2">{aiError}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <ResponsiveModalFooter className="px-6 py-3 bg-neutral-950/70 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center text-destructive text-sm min-h-[1.25rem]">
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
                  {/* Use an inline icon-like dot to avoid importing AlertCircle just for one spot */}
                  <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !role || !company}>
                {isSubmitting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        </ResponsiveModalFooter>
      </div>
    </TooltipProvider>
  )
}
