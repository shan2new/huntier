import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { Building2, GraduationCap, User2 } from 'lucide-react'
import type { Company, UserProfile } from '@/lib/api'
import { updateProfileWithRefresh, getProfileWithRefresh } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'
import { defineStepper } from '@/components/stepper'


type Persona = 'student' | 'intern' | 'professional'

export function ProfileCompletionDialog({ open, onOpenChange, onCompleted, allowSkip = false }: { open: boolean; onOpenChange: (v: boolean) => void; onCompleted?: (p: UserProfile) => void; allowSkip?: boolean }) {
  const { getToken } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Core profile fields
  const [persona, setPersona] = useState<Persona | null>(null)

  // Professional fields
  const [currentRole, setCurrentRole] = useState('')
  const [company, setCompany] = useState<Company | null>(null)

  // Student fields
  const [degree, setDegree] = useState('')
  const [institution, setInstitution] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [major, setMajor] = useState('')

  // Progressive stepper and validations
  const StepperDef = useMemo(() => defineStepper({ id: 'persona' }, { id: 'details' }), [])
  const isPersonaValid = !!persona
  const isDetailsValid = useMemo(() => {
    if (persona === 'professional') return currentRole.trim().length > 0 && !!company?.id
    if (persona === 'student' || persona === 'intern') {
      return (
        degree.trim().length > 0 &&
        institution.trim().length > 0 &&
        graduationYear.trim().length > 0 &&
        major.trim().length > 0
      )
    }
    return false
  }, [persona, currentRole, company, degree, institution, graduationYear, major])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const getTokenStr = async () => (await getToken()) || ''
        const p = await getProfileWithRefresh<UserProfile>(getTokenStr)
        if (cancelled) return
        if (p.persona) setPersona(p.persona)
        setCurrentRole(p.current_role || '')
        if (p.company) setCompany(p.company)
        if (p.persona_info) {
          const info = p.persona_info as any
          setDegree(info.degree || '')
          setInstitution(info.institution || '')
          setGraduationYear(info.graduation_year || '')
          setMajor(info.major || '')
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [open, getToken])

  const isValid = useMemo(() => isPersonaValid && isDetailsValid, [isPersonaValid, isDetailsValid])

  const handleSave = async () => {
    if (saving || !isValid || !persona) return
    setSaving(true)
    setError('')
    try {
      const getTokenStr = async () => (await getToken()) || ''
      const body: Partial<UserProfile> & { persona_info?: Record<string, any> } = {
        persona,
        current_role: persona === 'professional' ? currentRole : null,
        current_company_id: persona === 'professional' ? (company?.id || null) : null,
      }
      if (persona !== 'professional') {
        body.current_role = null
        body.current_company_id = null
      }
      body.persona_info =
        persona === 'professional'
          ? undefined
          : {
              degree,
              institution,
              graduation_year: graduationYear,
              major,
            }

      const updated = await updateProfileWithRefresh<UserProfile>(getTokenStr, { ...body } as any)

      onCompleted?.(updated)
      onOpenChange(false)
    } catch (e) {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-2xl p-0 overflow-hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="p-5 border-b">
          <DialogHeader>
            <DialogTitle>Complete your profile</DialogTitle>
            <DialogDescription>
              Help us tailor Huntier to you. This takes less than a minute.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-5 space-y-5">
          <StepperDef.Stepper.Provider initialStep="persona" tracking>
            {({ methods }) => (
              <>
                <StepperDef.Stepper.Navigation className="mb-4">
                  <StepperDef.Stepper.Step of="persona">
                    <StepperDef.Stepper.Title>Persona</StepperDef.Stepper.Title>
                    <StepperDef.Stepper.Description>Select your current status</StepperDef.Stepper.Description>
                  </StepperDef.Stepper.Step>
                  <StepperDef.Stepper.Step of="details">
                    <StepperDef.Stepper.Title>Details</StepperDef.Stepper.Title>
                    <StepperDef.Stepper.Description>Role or education</StepperDef.Stepper.Description>
                  </StepperDef.Stepper.Step>
                </StepperDef.Stepper.Navigation>

                <div className="min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {methods.current.id === 'persona' && (
                      <motion.div key="persona" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><User2 className="h-4 w-4" /> Persona</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {([
                              { id: 'professional', label: 'Working Professional' },
                              { id: 'student', label: 'Student' },
                              { id: 'intern', label: 'Intern' },
                            ] as Array<{ id: Persona; label: string }>).map((p) => (
                              <button
                                key={p.id}
                                className={`text-sm rounded-md border px-3 py-2 text-left transition-colors ${
                                  persona === p.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
                                }`}
                                onClick={() => setPersona(p.id)}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                          {!isPersonaValid && <p className="text-xs text-muted-foreground">Choose one to continue.</p>}
                        </div>
                      </motion.div>
                    )}

                    {methods.current.id === 'details' && (
                      <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                        {persona === 'professional' ? (
                          <>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Current Company</Label>
                              <CompanySearchCombobox value={company} onChange={setCompany} placeholder="Search your company" variant="dialog" />
                            </div>
                            <div className="space-y-2">
                              <Label>Current Role</Label>
                              <Input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Software Engineer" />
                            </div>
                            {!isDetailsValid && <p className="text-xs text-muted-foreground">Select your company and enter your role.</p>}
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Degree</Label>
                                <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="B.Tech, MS, etc." />
                              </div>
                              <div className="space-y-2">
                                <Label>Institution</Label>
                                <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Your college" />
                              </div>
                              <div className="space-y-2">
                                <Label>Graduation Year</Label>
                                <Input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2026" />
                              </div>
                              <div className="space-y-2">
                                <Label>Major</Label>
                                <Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" />
                              </div>
                            </div>
                            {!isDetailsValid && <p className="text-xs text-muted-foreground">Fill all fields to continue.</p>}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {error && <div className="text-sm text-destructive mt-2">{error}</div>}

                <DialogFooter className="p-0 pt-4">
                  <div className="flex items-center justify-between w-full">
                    {allowSkip ? (
                      <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Not now</Button>
                    ) : <span />}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => methods.prev()}
                        disabled={methods.current.id === 'persona' || saving}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => methods.next()}
                        disabled={
                          (methods.current.id === 'persona' && !isPersonaValid) ||
                          (methods.current.id === 'details' && !isDetailsValid)
                        }
                      >
                        Next
                      </Button>
                      <Button onClick={handleSave} disabled={!isValid || saving}>
                        {saving ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
                </DialogFooter>
              </>
            )}
          </StepperDef.Stepper.Provider>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileCompletionDialog


