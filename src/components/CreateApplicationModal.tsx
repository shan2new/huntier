import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import { addApplicationContactWithRefresh, transitionStageWithRefresh } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'
import {
  ResponsiveModal,
} from '@/components/ResponsiveModal'
import { useIsMobile } from '@/hooks/use-mobile'
import { ContactModal } from '@/components/ContactModal'
import { CreateApplicationModalMobile } from '@/components/application-form/CreateApplicationModalMobile'
import { CreateApplicationModalDesktop } from '@/components/application-form/CreateApplicationModalDesktop'

interface CreateApplicationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (app: ApplicationListItem) => void
  // Optional initial stage to transition the newly created application into
  defaultStage?: string
}

// source options rendered inside presentational components


interface Contact {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  isThirdParty: boolean
  description: string
  avatar?: string
  is_primary?: boolean
}

export function CreateApplicationModal({
  open,
  onOpenChange,
  onCreated,
  defaultStage,
}: CreateApplicationModalProps) {
  const { apiCall } = useApi()
  const { getToken } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Stage 1: Company Search
  const [company, setCompany] = useState<Company | null>(null)
  
  // Stage 2: Application Form
  const [role, setRole] = useState('')
  const [includeJobUrl, setIncludeJobUrl] = useState(false)
  const [jobUrl, setJobUrl] = useState('')
  // Compensation state variables (separate for fixed and variable)
  const [fixedMinLpa, setFixedMinLpa] = useState('15')
  const [fixedMaxLpa, setFixedMaxLpa] = useState('35')
  const [varMinLpa, setVarMinLpa] = useState('')
  const [varMaxLpa, setVarMaxLpa] = useState('')
  const [source, setSource] = useState('applied_self')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
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
      setFixedMinLpa('15')
      setFixedMaxLpa('35')
      setVarMinLpa('')
      setVarMaxLpa('')
      setSource('applied_self')
      setSelectedPlatform(null)
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
      const url = includeJobUrl ? jobUrl : undefined
      const selectedPlatformId = selectedPlatform?.id

      // Prepare compensation data
      const compensation = {
        fixed_min_lpa: fixedMinLpa ? parseFloat(fixedMinLpa) || null : null,
        fixed_max_lpa: fixedMaxLpa ? parseFloat(fixedMaxLpa) || null : null,
        var_min_lpa: varMinLpa ? parseFloat(varMinLpa) || null : null,
        var_max_lpa: varMaxLpa ? parseFloat(varMaxLpa) || null : null
      }

      const applicationData = {
        company: { company_id: company.id },
        role,
        job_url: url ? normalizeUrl(url) : undefined,
        platform_id: selectedPlatformId,
        source,
        compensation: Object.values(compensation).some(val => val !== null) ? compensation : null,
      }
      const application = await apiCall<ApplicationListItem>('/v1/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
      })

      // Helper to fetch token for authenticated calls (transition, contacts)
      const getTokenStr = async () => (await getToken()) || ''

      // Save contacts after application is created
      if (contacts.length) {
        try {
          await Promise.all(
            contacts.map((c, idx) =>
              addApplicationContactWithRefresh(getTokenStr, application.id, {
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
              apiCall(`/v1/applications/${application.id}/notes`, {
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

      // Optionally transition to the desired default stage (e.g., "wishlist")
      let created = application
      if (defaultStage) {
        try {
          // Only transition if different (case-insensitive compare)
          const current = (application.stage.name || '').toLowerCase()
          const desired = defaultStage.toLowerCase()
          if (current !== desired) {
            await transitionStageWithRefresh(getTokenStr, application.id, defaultStage)
          }
          // Fetch the updated application after transition
          created = await apiCall<ApplicationListItem>(`/v1/applications/${application.id}`)
        } catch (e) {
          console.error('Failed to set default stage:', e)
          // Non-blocking: fall back to created application
          created = application
        }
      }

      onCreated?.(created)
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
        id: 'id' in contact ? contact.id : `contact-${Date.now()}`,
        is_primary: contacts.length === 0 // First contact is primary
      }
      setContacts(prev => [...prev, newContact])
    }
    setContactModalOpen(false)
    setEditingContact(null)
  }

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId))
  }


  const isMobile = useIsMobile()

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={cn(
          'p-0 gap-0',
          isMobile 
            ? 'bg-background' 
            : 'max-w-4xl rounded-xl bg-neutral-950/95 shadow-2xl'
        )}
      >
        {isMobile ? (
          <CreateApplicationModalMobile
            company={company}
            setCompany={setCompany}
            companySearchOpen={companySearchOpen}
            setCompanySearchOpen={setCompanySearchOpen}
            role={role}
            setRole={setRole}
            includeJobUrl={includeJobUrl}
            setIncludeJobUrl={setIncludeJobUrl}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            fixedMinLpa={fixedMinLpa}
            fixedMaxLpa={fixedMaxLpa}
            setFixedMinLpa={setFixedMinLpa}
            setFixedMaxLpa={setFixedMaxLpa}
            varMinLpa={varMinLpa}
            varMaxLpa={varMaxLpa}
            setVarMinLpa={setVarMinLpa}
            setVarMaxLpa={setVarMaxLpa}
            source={source}
            setSource={setSource}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            contacts={contacts}
            setContactModalOpen={setContactModalOpen}
            setEditingContact={setEditingContact}
            handleDeleteContact={handleDeleteContact}
            pendingNotes={pendingNotes}
            addPendingNote={addPendingNote}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
            error={error}
            handleSubmit={handleSubmit}
            handleClose={handleClose}
          />
        ) : (
          <CreateApplicationModalDesktop
            company={company}
            setCompany={setCompany}
            companySearchOpen={companySearchOpen}
            setCompanySearchOpen={setCompanySearchOpen}
            role={role}
            setRole={setRole}
            includeJobUrl={includeJobUrl}
            setIncludeJobUrl={setIncludeJobUrl}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            fixedMinLpa={fixedMinLpa}
            fixedMaxLpa={fixedMaxLpa}
            setFixedMinLpa={setFixedMinLpa}
            setFixedMaxLpa={setFixedMaxLpa}
            varMinLpa={varMinLpa}
            varMaxLpa={varMaxLpa}
            setVarMinLpa={setVarMinLpa}
            setVarMaxLpa={setVarMaxLpa}
            source={source}
            setSource={setSource}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            contacts={contacts}
            setContactModalOpen={setContactModalOpen}
            setEditingContact={setEditingContact}
            handleDeleteContact={handleDeleteContact}
            pendingNotes={pendingNotes}
            addPendingNote={addPendingNote}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
            error={error}
            handleSubmit={handleSubmit}
            handleClose={handleClose}
          />
        )}
      </ResponsiveModal>

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
