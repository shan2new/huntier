import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Briefcase, Circle, MapPin, Sparkles } from 'lucide-react'
import type { ApplicationListItem, Company, Platform } from '@/lib/api'
import type { StageObject } from '@/types/application'
import {
  addApplicationContactWithRefresh,
  deleteApplicationWithRefresh,
  getApplicationWithRefresh,
  getCompanyByIdWithRefresh,
  listApplicationContactsWithRefresh,
  listPlatformsWithRefresh,
  patchApplicationWithRefresh,
  transitionStageWithRefresh,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  NestedResponsiveModal,
  ResponsiveModal,
} from '@/components/ResponsiveModal'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { StageVisualization } from '@/components/StageVisualization'
import { UpdateApplicationModalMobile } from '@/components/application-form/UpdateApplicationModalMobile'
import { UpdateApplicationModalDesktop } from '@/components/application-form/UpdateApplicationModalDesktop'
import { ContactModal } from '@/components/ContactModal'

// Child contact shape expected by UpdateApplicationModalMobile/Desktop
type ChildContact = {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  is_primary?: boolean
}

const toChildContacts = (list: Array<Contact>): Array<ChildContact> =>
  list.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    is_primary: c.is_primary,
  }))

const milestoneConfig = {
  exploration: { label: 'Exploration', icon: MapPin },
  screening: { label: 'Screening', icon: Circle },
  interviewing: { label: 'Interviewing', icon: Briefcase },
  post_interview: { label: 'Offer', icon: Sparkles },
}
// source options are handled within child components

interface Contact {
  id: string
  name: string
  role: 'recruiter' | 'referrer' | 'interviewer'
  isThirdParty: boolean
  description: string
  avatar?: string
  is_primary?: boolean
}

interface UpdateApplicationModalProps {
  open: boolean
  onClose: () => void
  applicationId: string
  onUpdated?: (app: ApplicationListItem) => void
  onDeleted?: (id: string) => void
}

function UpdateApplicationModal({
  applicationId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: UpdateApplicationModalProps) {
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Application data
  const [app, setApp] = useState<ApplicationListItem | null>(null)

  // Form fields
  const [url, setUrl] = useState('')
  const [role, setRole] = useState('')
  const [source, setSource] = useState('applied_self')
  const [includeJobUrl, setIncludeJobUrl] = useState(false) // Use platform list to display names
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null)
  const [companySearchOpen, setCompanySearchOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Tab state for Notes/Conversations
  const [activeTab, setActiveTab] = useState<'notes' | 'conversations'>('notes')

  // Stage visualization state
  const [stageVisualizationOpen, setStageVisualizationOpen] = useState(false)

  // Contact management state
  const [contacts, setContacts] = useState<Array<Contact>>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Compensation fields
  const [fixedMinLpa, setFixedMinLpa] = useState('')
  const [fixedMaxLpa, setFixedMaxLpa] = useState('')
  const [varMinLpa, setVarMinLpa] = useState('')
  const [varMaxLpa, setVarMaxLpa] = useState('')

  // Status fields
  const [stageStatus, setStageStatus] = useState<StageObject>({ id: 'applied', name: 'Applied', type: 'standard' })

  // Consider these stages as "in progress" for a visual pulse indicator
  const inProgressStages = new Set([
    'applied',
    'hr_shortlisted',
    'hm_shortlisted',
    'interview_scheduled',
    'interview_rescheduled',
    'offered',
  ])
  const isInProgress = inProgressStages.has(stageStatus.id)

  // Map backend stage enums to compact badge labels with milestone icons
  const stageBadgeLabel = (stage: StageObject, milestone?: string) => {
    const config = milestone && milestone in milestoneConfig ? milestoneConfig[milestone as keyof typeof milestoneConfig] : null
    if (config) {
      const IconComponent = config.icon
      return (
        <div className="flex items-center gap-1.5">
          <IconComponent className="h-3.5 w-3.5" />
          <span>{stage.name}</span>
        </div>
      )
    }
    return stage.name
  }

  // Load application data
  useEffect(() => {
    if (!open || !applicationId) return

    const loadApplication = async () => {
      setLoading(true)
      try {
        const getTokenStr = async () => (await getToken()) || ''
        const appData = await getApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId)

        // Hydrate company if backend didn't embed it
        let company: Company | null = null
        if (appData.company) {
          company = appData.company
        } else if (appData.company_id) {
          try {
            company = await getCompanyByIdWithRefresh<Company>(getTokenStr, appData.company_id)
          } catch {
            // ignore if company fetch fails
          }
        }

        const hydratedApp = { ...appData, company }
        setApp(hydratedApp)

        // Populate form fields from loaded data
        setUrl(hydratedApp.job_url || '')
        setRole(hydratedApp.role || '')
        setSource(hydratedApp.source || 'applied_self')
        setSelectedPlatformId(hydratedApp.platform_id || null)
        setStageStatus(hydratedApp.stage)

        // Populate compensation data if available
        if (hydratedApp.compensation) {
          setFixedMinLpa(hydratedApp.compensation.fixed_min_lpa?.toString() || '')
          setFixedMaxLpa(hydratedApp.compensation.fixed_max_lpa?.toString() || '')
          setVarMinLpa(hydratedApp.compensation.var_min_lpa?.toString() || '')
          setVarMaxLpa(hydratedApp.compensation.var_max_lpa?.toString() || '')
        }
        if (hydratedApp.platform) setSelectedPlatform(hydratedApp.platform)
        setIncludeJobUrl(!!hydratedApp.job_url)

        // Load contacts for this application
        loadContacts(applicationId)
      } catch (err) {
        setError('Failed to load application')
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadApplication()
  }, [open, applicationId, getToken])

  // Load application contacts
  const loadContacts = async (appId: string) => {
    setContactsLoading(true)
    try {
      const getTokenStr = async () => (await getToken()) || ''
      const contactsData = await listApplicationContactsWithRefresh<Array<any>>(getTokenStr, appId)
      
      // Transform API contacts to local contact format
      const transformedContacts: Array<Contact> = contactsData.map((contact: any) => ({
        id: contact.id,
        name: contact.contact?.name || 'Unknown',
        role: contact.role === 'hiring_manager' || contact.role === 'other' ? 'recruiter' : contact.role || 'recruiter',
        isThirdParty: false, // This field might not exist in API response
        description: contact.contact?.title || '',
        is_primary: contact.is_primary
      }))
      
      setContacts(transformedContacts)
    } catch (err) {
      console.error('Failed to load contacts:', err)
      setContacts([])
    } finally {
      setContactsLoading(false)
    }
  }

  // Load platforms for selection
  useEffect(() => {
    if (!open) return
    const getTokenStr = async () => (await getToken()) || ''
    listPlatformsWithRefresh<Array<Platform>>(getTokenStr)
      .then((rows) => {
        // Set selected platform if application already has one
        if (app?.platform_id) {
          const platform = rows.find((p) => p.id === app.platform_id)
          if (platform) {
            setSelectedPlatform(platform)
            setSelectedPlatformId(platform.id)
          }
        }
      })
      .catch(console.error)
  }, [open, getToken, app])

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!role || !app || !app.id) return

    setIsSubmitting(true)
    setError('')

    try {
      const getTokenStr = async () => (await getToken()) || ''
      
      // Prepare compensation data
      const compensation = {
        fixed_min_lpa: fixedMinLpa ? parseFloat(fixedMinLpa) || null : null,
        fixed_max_lpa: fixedMaxLpa ? parseFloat(fixedMaxLpa) || null : null,
        var_min_lpa: varMinLpa ? parseFloat(varMinLpa) || null : null,
        var_max_lpa: varMaxLpa ? parseFloat(varMaxLpa) || null : null
      }
      
      const params = {
        role,
        job_url: includeJobUrl ? url : null,
        source,
        stage: stageStatus.id,
        platform_id: selectedPlatformId,
        compensation: Object.values(compensation).some(val => val !== null) ? compensation : null
      }
      
      const updated = await patchApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId, params)

      setApp((prev: ApplicationListItem | null) => ({ ...(prev ?? {}), ...updated }))
      onUpdated?.(updated)
      onClose()
    } catch (err) {
      setError('Failed to update application')
      console.error('Save error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const getTokenStr = async () => (await getToken()) || ''
      await deleteApplicationWithRefresh(getTokenStr, applicationId)
      onDeleted?.(applicationId)
      setShowDeleteConfirm(false)
      onClose()
    } catch (err) {
      setError('Failed to delete application')
      console.error('Delete error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form state after a brief delay to allow transition to start
    setTimeout(() => {
      setApp(null)
      setUrl('')
      setRole('')
      setSource('applied_self')
      setIncludeJobUrl(false)
      setSelectedPlatform(null)
      setSelectedPlatformId(null)
      setContacts([])
      setContactsLoading(false)
      setContactModalOpen(false)
      setEditingContact(null)
      setError('')
    }, 150)
  }


  const isMobile = useIsMobile()

  // Shared handler for company change, keeps logic in parent
  const onChangeCompany = async (c: Company) => {
    try {
      const getTokenStr = async () => (await getToken()) || ''
      const updated = await patchApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId, { company_id: c.id })
      setApp((prev: ApplicationListItem | null) => {
        const merged: ApplicationListItem = { ...(prev ?? ({} as any)), ...(updated as any), company: c, company_id: c.id } as ApplicationListItem
        // reflect derived fields locally
        setSelectedPlatformId(merged.platform_id || null)
        setSource(merged.source || source)
        setRole(merged.role || role)
        setUrl(merged.job_url || url)
        setIncludeJobUrl(!!merged.job_url)
        setCompanySearchOpen(false)
        setError('')
        onUpdated?.(merged)
        return merged
      })
    } catch (err) {
      console.error('Failed to change company:', err)
      setError('Failed to change company')
    }
  }

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onClose}
        contentClassName={cn(
          'p-0 gap-0',
          isMobile 
            ? 'bg-background' 
            : 'max-w-5xl rounded-xl bg-neutral-950/95 border border-border'
        )}
        hideClose
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Loading Application</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
              Fetching application details, compensation info, and contact data...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Circle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-destructive">Failed to Load Application</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              We couldn't load the application details. This might be due to a network issue or the application may no longer exist.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  setError('')
                  // Trigger reload by changing applicationId dependency
                  if (applicationId) {
                    const loadApplication = async () => {
                      setLoading(true)
                      try {
                        const getTokenStr = async () => (await getToken()) || ''
                        const appData = await getApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId)
                        // ... rest of loading logic
                        let company: Company | null = null
                        if (appData.company) {
                          company = appData.company
                        } else if (appData.company_id) {
                          try {
                            company = await getCompanyByIdWithRefresh<Company>(getTokenStr, appData.company_id)
                          } catch {
                            // ignore if company fetch fails
                          }
                        }
                        const hydratedApp = { ...appData, company }
                        setApp(hydratedApp)
                        setUrl(hydratedApp.job_url || '')
                        setRole(hydratedApp.role || '')
                        setSource(hydratedApp.source || 'applied_self')
                        setSelectedPlatformId(hydratedApp.platform_id || null)
                        setStageStatus(hydratedApp.stage)
                        if (hydratedApp.compensation) {
                          setFixedMinLpa(hydratedApp.compensation.fixed_min_lpa?.toString() || '')
                          setFixedMaxLpa(hydratedApp.compensation.fixed_max_lpa?.toString() || '')
                          setVarMinLpa(hydratedApp.compensation.var_min_lpa?.toString() || '')
                          setVarMaxLpa(hydratedApp.compensation.var_max_lpa?.toString() || '')
                        }
                        if (hydratedApp.platform) setSelectedPlatform(hydratedApp.platform)
                        setIncludeJobUrl(!!hydratedApp.job_url)
                        loadContacts(applicationId)
                      } catch (err) {
                        setError('Failed to load application')
                        console.error('Load error:', err)
                      } finally {
                        setLoading(false)
                      }
                    }
                    loadApplication()
                  }
                }}
                className="min-w-[100px]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : isMobile ? (
          <UpdateApplicationModalMobile
            app={app}
            stageStatus={stageStatus}
            stageBadge={stageBadgeLabel(stageStatus, app?.milestone)}
            isInProgress={isInProgress}
            companySearchOpen={companySearchOpen}
            setCompanySearchOpen={setCompanySearchOpen}
            onChangeCompany={onChangeCompany}
            role={role}
            setRole={setRole}
            includeJobUrl={includeJobUrl}
            setIncludeJobUrl={setIncludeJobUrl}
            url={url}
            setUrl={setUrl}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fixedMinLpa={fixedMinLpa}
            fixedMaxLpa={fixedMaxLpa}
            varMinLpa={varMinLpa}
            varMaxLpa={varMaxLpa}
            setFixedMinLpa={setFixedMinLpa}
            setFixedMaxLpa={setFixedMaxLpa}
            setVarMinLpa={setVarMinLpa}
            setVarMaxLpa={setVarMaxLpa}
            source={source}
            setSource={setSource}
            selectedPlatform={selectedPlatform}
            onPlatformChange={(p) => { setSelectedPlatform(p); setSelectedPlatformId(p?.id ?? null) }}
            contactsLoading={contactsLoading}
            contacts={toChildContacts(contacts)}
            onAddContactClick={() => { setEditingContact(null); setContactModalOpen(true) }}
            onEditContact={(c: ChildContact) => {
              const found = contacts.find((x) => x.id === c.id) || null
              setEditingContact(found)
              setContactModalOpen(true)
            }}
            error={error}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            onSave={() => void handleSave()}
            onAskDelete={() => setShowDeleteConfirm(true)}
            onStageVizOpen={() => setStageVisualizationOpen(true)}
          />
        ) : (
          <UpdateApplicationModalDesktop
            app={app}
            stageStatus={stageStatus}
            stageBadge={stageBadgeLabel(stageStatus, app?.milestone)}
            isInProgress={isInProgress}
            companySearchOpen={companySearchOpen}
            setCompanySearchOpen={setCompanySearchOpen}
            onChangeCompany={onChangeCompany}
            role={role}
            setRole={setRole}
            includeJobUrl={includeJobUrl}
            setIncludeJobUrl={setIncludeJobUrl}
            url={url}
            setUrl={setUrl}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            fixedMinLpa={fixedMinLpa}
            fixedMaxLpa={fixedMaxLpa}
            varMinLpa={varMinLpa}
            varMaxLpa={varMaxLpa}
            setFixedMinLpa={setFixedMinLpa}
            setFixedMaxLpa={setFixedMaxLpa}
            setVarMinLpa={setVarMinLpa}
            setVarMaxLpa={setVarMaxLpa}
            source={source}
            setSource={setSource}
            selectedPlatform={selectedPlatform}
            onPlatformChange={(p) => { setSelectedPlatform(p); setSelectedPlatformId(p?.id ?? null) }}
            contactsLoading={contactsLoading}
            contacts={toChildContacts(contacts)}
            onAddContactClick={() => { setEditingContact(null); setContactModalOpen(true) }}
            onEditContact={(c: ChildContact) => {
              const found = contacts.find((x) => x.id === c.id) || null
              setEditingContact(found)
              setContactModalOpen(true)
            }}
            error={error}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            onSave={() => void handleSave()}
            onAskDelete={() => setShowDeleteConfirm(true)}
            onStageVizOpen={() => setStageVisualizationOpen(true)}
            onActivity={(occurredAt) => {
              setApp(prev => prev ? { ...prev, last_activity_at: occurredAt } : prev)
              // Also update stage badge/derived UI – parent gets the updated app from server on next fetch,
              // but we optimistically propagate locally.
              onUpdated?.({ ...(app as any), last_activity_at: occurredAt } as ApplicationListItem)
            }}
          />
        )}
      </ResponsiveModal>

      {/* Delete confirmation dialog */}
      <NestedResponsiveModal open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} level="secondary">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Circle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete Application</h3>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            This will permanently delete the application and all related data including contacts, conversations, interviews, and activity history.
          </p>
          
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Application'
              )}
            </Button>
          </div>
        </div>
      </NestedResponsiveModal>
      
      {/* Stage Visualization Dialog */}
      <StageVisualization
        open={stageVisualizationOpen}
        onOpenChange={setStageVisualizationOpen}
        currentStage={stageStatus}
        applicationId={applicationId}
        onStageChange={async (newStageId, reason) => {
          // Store current state for potential rollback
          const previousApp = app
          const previousStageStatus = stageStatus
          
          // Optimistic update - immediately update UI
          const optimisticStage: StageObject = typeof newStageId === 'string' 
            ? { id: newStageId, name: newStageId, type: 'standard' }
            : newStageId
          
          setStageStatus(optimisticStage)
          setApp(prev => prev ? {
            ...prev,
            stage: optimisticStage
          } : null)
          
          // Handle withdrawn with reason via transition endpoint
          if (newStageId === 'withdrawn') {
            try {
              const getTokenStr = async () => (await getToken()) || ''
              await transitionStageWithRefresh(getTokenStr, applicationId, 'withdrawn', reason)
              // Refresh application to reflect server state
              const updated = await getApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId)
              setApp(updated as any)
              setStageStatus(typeof updated.stage === 'string' 
                ? { id: updated.stage, name: updated.stage, type: 'standard' }
                : updated.stage)
              onUpdated?.(updated)
              setError('')
              // Keep dialog open - removed setStageVisualizationOpen(false)
            } catch (err) {
              console.error('Failed to withdraw application:', err)
              // Revert optimistic update on error
              setApp(previousApp)
              setStageStatus(previousStageStatus)
              setError('Failed to withdraw application')
            }
            return
          }
          
          // Perform precise stage transition using backend enums
          try {
            const getTokenStr = async () => (await getToken()) || ''
            await transitionStageWithRefresh(getTokenStr, applicationId, newStageId)
            const updated = await getApplicationWithRefresh<ApplicationListItem>(getTokenStr, applicationId)
            setApp(updated as any)
            setStageStatus(typeof updated.stage === 'string' 
              ? { id: updated.stage, name: updated.stage, type: 'standard' }
              : updated.stage)
            onUpdated?.(updated)
            setError('')
            // Keep dialog open - removed setStageVisualizationOpen(false)
          } catch (err) {
            console.error('Failed to transition stage:', err)
            // Revert optimistic update on error
            setApp(previousApp)
            setStageStatus(previousStageStatus)
            setError('Failed to transition stage')
          }
        }}
      />
      {/* Contact Add/Edit Modal */}
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        contact={editingContact || undefined}
        onClose={() => { setContactModalOpen(false); setEditingContact(null) }}
        onSave={async (data) => {
          try {
            if (editingContact && 'id' in data) {
              // Local edit only
              setContacts((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } as Contact : c)))
            } else if (app?.id) {
              const getTokenStr = async () => (await getToken()) || ''
              await addApplicationContactWithRefresh(getTokenStr, app.id, {
                contact: {
                  name: data.name,
                  title: 'description' in data ? (data as any).description || undefined : undefined,
                },
                role: (data as any).role,
                is_primary: contacts.length === 0,
              })
              await loadContacts(app.id)
            }
            setContactModalOpen(false)
            setEditingContact(null)
          } catch (err) {
            console.error('Failed to save contact:', err)
            setError('Failed to save contact')
          }
        }}
      />
      
    </>
  )
}

export default UpdateApplicationModal
export { UpdateApplicationModal }
