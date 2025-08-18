import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  AlertCircle,
  Briefcase,
  Building2,
  DollarSign,
  ExternalLink,
  Flag,
  Globe,
  Phone,
  Plus,
  Send,
  Target,
  UserCheck,
  Users,
} from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import { addApplicationContact, apiWithToken } from '@/lib/api'
import { cn, extractHostname } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
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
import { ContactModal } from '@/components/ContactModal'
import { PlatformCombobox } from '@/components/PlatformCombobox'
import { RoleSuggestionCombobox } from '@/components/RoleSuggestionCombobox'
import { ApplicationNotes } from '@/components/ApplicationNotes'
import { ApplicationConversations } from '@/components/ApplicationConversations'

interface CreateApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (app: ApplicationListItem) => void
}

const sourceOptions = [
  { value: 'applied_self', label: 'Direct', icon: Send },
  { value: 'applied_referral', label: 'Referral', icon: UserCheck },
  { value: 'recruiter_outreach', label: 'Recruiter', icon: Phone },
]

const stageStatusOptions = [
  { value: 'applied_self', label: 'Applied' },
  { value: 'recruiter_discussion', label: 'In Discussion' },
  { value: 'pending_shortlist', label: 'Pending Review' },
  { value: 'interview_shortlist', label: 'Interview Shortlisted' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Completed' },
  { value: 'offer', label: 'Offer Received' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'on_hold', label: 'On Hold' },
]

interface Contact {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  isThirdParty: boolean
  description: string
  avatar?: string
}

export function CreateApplicationModal({
  open,
  onOpenChange,
  onCreated,
}: CreateApplicationModalProps) {
  const { getToken } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Stage 1: Company Search
  const [company, setCompany] = useState<Company | null>(null)
  
  // Stage 2: Application Form
  const [role, setRole] = useState('')
  const [includeJobUrl, setIncludeJobUrl] = useState(false)
  const [jobUrl, setJobUrl] = useState('')
  const [salaryRange, setSalaryRange] = useState([15, 35])
  const [source, setSource] = useState('applied_self')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [stageStatus, setStageStatus] = useState('applied_self')
  const [contacts, setContacts] = useState<Array<Contact>>([])
  const [pendingNotes, setPendingNotes] = useState<Array<string>>([])
  const [companySearchOpen, setCompanySearchOpen] = useState(false)
  
  // Tab state for Notes/Conversations
  const [activeTab, setActiveTab] = useState<'notes' | 'conversations'>('notes')
  
  // Contact modal
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // (Removed) Platforms load: handled inside PlatformCombobox when opened

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCompany(null)
      setRole('')
      setIncludeJobUrl(false)
      setJobUrl('')
      setSalaryRange([15, 35])
      setSource('applied_self')
      setSelectedPlatform(null)
      setStageStatus('applied_self')
      setContacts([])
      setPendingNotes([])
      setError('')
    }
  }, [open])
  
  // Add a note to pending notes list or update pending notes
  const addPendingNote = (content: string, updatedNotes?: Array<string>) => {
    if (content === "__UPDATE_PENDING_NOTES__" && updatedNotes) {
      // Special case to handle note deletion
      setPendingNotes(updatedNotes)
    } else {
      // Regular case to add a new note
      setPendingNotes([...pendingNotes, content])
    }
  }

  const normalizeUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const handleSubmit = async () => {
    if (!role || !company) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      
      const applicationData = {
        company: { company_id: company.id },
        role,
        job_url: includeJobUrl && jobUrl ? normalizeUrl(jobUrl) : undefined,
        platform_id: selectedPlatform?.id,
        source,
        stage: stageStatus,
        compensation: {
          fixed_min_lpa: salaryRange[0],
          fixed_max_lpa: salaryRange[1],
        },
      }
      const application = await apiWithToken<ApplicationListItem>('/v1/applications', token, {
        method: 'POST',
        body: JSON.stringify(applicationData),
      })
      
      // Save contacts after application is created
      if (contacts.length) {
        try {
          await Promise.all(
            contacts.map((c, idx) =>
              addApplicationContact(token, application.id, {
                contact: { name: c.name },
                role: c.role,
                is_primary: idx === 0,
              }),
            ),
          )
        } catch (e) {
          console.error('Failed to save one or more contacts:', e)
          // Do not block application creation on contact failure
        }
      }
      
      // Save notes after application is created
      if (pendingNotes.length) {
        try {
          await Promise.all(
            pendingNotes.map(content =>
              apiWithToken(`/v1/applications/${application.id}/notes`, token, {
                method: 'POST',
                body: JSON.stringify({ content }),
              })
            )
          )
        } catch (e) {
          console.error('Failed to save one or more notes:', e)
          // Do not block application creation on notes failure
        }
      }
      
      onCreated?.(application)
      handleClose()
    } catch (err) {
      setError('Failed to create application')
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }


  const handleSaveContact = (contact: Contact | Omit<Contact, 'id'>) => {
    if (editingContact && 'id' in contact) {
      // Update existing contact
      setContacts(prev => prev.map(c => c.id === editingContact.id ? contact : c))
    } else {
      // Add new contact with generated ID
      const newContact: Contact = {
        ...contact,
        id: 'id' in contact ? contact.id : `contact-${Date.now()}`
      }
      setContacts(prev => [...prev, newContact])
    }
    setContactModalOpen(false)
    setEditingContact(null)
  }


  if (!open) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent hideClose className="max-w-4xl p-0 gap-0 border border-border rounded-xl bg-card">
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                {company ? (
                  // Show company info when selected
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      {company.logo_blob_base64 ? (
                        <img
                          src={company.logo_blob_base64.startsWith('data:') ? company.logo_blob_base64 : `data:image/png;base64,${company.logo_blob_base64}`}
                          alt={company.name}
                          className="w-10 h-10 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <DialogTitle className="text-lg font-semibold tracking-tight truncate">
                          {role || 'New Application'}
                        </DialogTitle>
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
                              <a
                                className="truncate inline-flex items-center gap-1 text-primary"
                                href={company.website_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="h-3 w-3" /> {extractHostname(company.website_url)}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <CompanySearchCombobox
                      value={company}
                      onChange={(c) => {
                        setCompany(c)
                        setCompanySearchOpen(false)
                      }}
                      open={companySearchOpen}
                      onOpenChange={setCompanySearchOpen}
                      variant="dialog"
                      triggerAsChild={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3"
                        >
                          Change
                        </Button>
                      }
                    />
                  </>
                ) : (
                  // Show create application when no company selected
                  <>
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                      Create Application
                    </DialogTitle>
                  </>
                )}
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {!company ? (
                // Stage 1: Company Search
                <div className="flex items-center justify-center h-full p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full max-w-md space-y-4"
                  >
                    <div className="text-center space-y-2">
                      <Building2 className="h-12 w-12 text-primary mx-auto" />
                      <h3 className="text-lg font-medium">Select Company</h3>
                      <p className="text-sm text-muted-foreground">
                        Start by searching for the company you're applying to
                      </p>
                    </div>
                    
                    <CompanySearchCombobox
                      value={company}
                      onChange={(c) => setCompany(c)}
                      placeholder="Search"
                    />
                  </motion.div>
                </div>
              ) : (
                // Stage 2: Application Form
                <div className="flex-1 overflow-y-auto p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative grid grid-cols-[3fr_2fr] gap-6 h-full"
                  >
                    <div className="absolute inset-y-0 left-[60%] -translate-x-1/2 w-px bg-border pointer-events-none" aria-hidden="true"></div>
                      {/* Column 1: Basic Information */}
                    <div className="space-y-4 pr-6">
                      {/* Role */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Role
                        </Label>
                        <RoleSuggestionCombobox
                          companyId={company.id}
                          onChoose={(s) => setRole(s.role)}
                          currentRole={role}
                          showAsInput
                          inputValue={role}
                          onInputValueChange={setRole}
                          placeholder="e.g. Senior Software Engineer"
                          className="w-full"
                        />
                      </div>

                      {/* Job URL */}
                      <div className="space-y-3 w-full">
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
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                placeholder="https://company.com/careers/job-123"
                                className="w-full"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Notes & Conversations Tabs */}
                      <div className="space-y-3 mt-6">
                        <div className="flex gap-2 border-b">
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
                        
                        {activeTab === 'notes' ? (
                          <ApplicationNotes
                            token={null}
                            isCreating={true}
                            pendingNotes={pendingNotes}
                            onAddPendingNote={addPendingNote}
                          />
                        ) : (
                          <ApplicationConversations
                            token={null}
                            isCreating={true}
                            className="h-[400px]"
                          />
                        )}
                      </div>

                      {/* Salary Range */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Salary Range (LPA)
                        </Label>
                        
                        <div className="space-y-4">
                          {/* Number inputs above slider */}
                          <div className="flex justify-between gap-4">
                            <Input
                              type="text"
                              value={salaryRange[0] || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setSalaryRange([value === '' ? 0 : Number(value), salaryRange[1]])
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value
                                const numValue = value === '' ? 10 : Number(value)
                                setSalaryRange([numValue, salaryRange[1]])
                              }}
                              className="w-20 shrink-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="10"
                            />
                            <Input
                              type="text"
                              value={salaryRange[1] || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setSalaryRange([salaryRange[0], value === '' ? 0 : Number(value)])
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value
                                const numValue = value === '' ? 30 : Number(value)
                                setSalaryRange([salaryRange[0], numValue])
                              }}
                              className="w-20 shrink-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="30"
                            />
                          </div>
                          
                          {/* Slider below inputs */}
                          <div className="px-1">
                            <Slider
                              value={salaryRange}
                              onValueChange={setSalaryRange}
                              min={0}
                              max={100}
                              step={0.5}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="text-xs text-muted-foreground text-center">
                            ₹{salaryRange[0]} - ₹{salaryRange[1]} LPA
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Additional Details */}
                    <div className="space-y-4 pl-6">
                      {/* Source */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Source
                        </Label>
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
                                    <option.icon className="h-4 w-4" />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Platform (command-style picker) */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Platform
                        </Label>
                        <PlatformCombobox
                          value={selectedPlatform}
                          onChange={setSelectedPlatform}
                          placeholder="Select platform"
                        />
                      </div>

                      {/* Stage and Status */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Stage & Status
                        </Label>
                        <Select value={stageStatus} onValueChange={setStageStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Current stage</SelectLabel>
                              {stageStatusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Contacts */}
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Contacts
                        </Label>
                        
                        <div className="space-y-2">
                          <AnimatePresence>
                            {contacts.map((contact) => (
                              <motion.div
                                key={contact.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="flex items-center gap-2 p-2 rounded-md border border-border bg-background/50 hover:bg-background/70 cursor-pointer transition-colors"
                                onClick={() => {
                                  setEditingContact(contact)
                                  setContactModalOpen(true)
                                }}
                              >
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium">
                                    {contact.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate">{contact.name}</div>
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                      {contact.role}
                                    </Badge>
                                    {contact.isThirdParty && (
                                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                        3rd Party
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setContactModalOpen(true)}
                            className="w-full h-8 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Contact
                          </Button>
                        </div>
                      </div>
                      
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-background/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button  size="sm" variant="outline" onClick={handleClose}>Cancel</Button>
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
                </div>
                
                <div className="flex items-center justify-end w-full">
                  <Button
                    size="sm" 
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
                      'Create'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        onSave={handleSaveContact}
        contact={editingContact}
        onClose={() => {
          setContactModalOpen(false)
          setEditingContact(null)
        }}
      />
    </>
  )
}
