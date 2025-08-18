import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  ChevronDown,
  Clock, 
  DollarSign, 
  MessageSquare, 
  Save,
  Settings,
  Target,
  TrendingUp,
  User
} from 'lucide-react'
import type { Company, UserProfile } from '@/lib/api'
import { apiWithToken } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar as DateCalendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'
import { RoleSuggestionCombobox } from '@/components/RoleSuggestionCombobox'

type Profile = UserProfile

interface RecruiterQA {
  current_ctc_text?: string
  expected_ctc_text?: string
  notice_period_text?: string
  reason_leaving_current_text?: string
  past_leaving_reasons_text?: string
}

const qaFields = [
  {
    key: 'current_ctc_text',
    label: 'Current CTC',
    placeholder: 'e.g., ₹12 LPA fixed + ₹3 LPA variable',
    icon: DollarSign,
    description: 'Your current compensation package'
  },
  {
    key: 'expected_ctc_text',
    label: 'Expected CTC',
    placeholder: 'e.g., ₹18-22 LPA (negotiable based on role)',
    icon: TrendingUp,
    description: 'Your salary expectations for new roles'
  },
  {
    key: 'notice_period_text',
    label: 'Notice Period',
    placeholder: 'e.g., 60 days (can negotiate for faster transition)',
    icon: Clock,
    description: 'Your availability and notice period details'
  },
  {
    key: 'reason_leaving_current_text',
    label: 'Reason for Leaving',
    placeholder: 'e.g., Seeking growth opportunities and new challenges',
    icon: Target,
    description: 'Why you\'re looking for a change'
  },
  {
    key: 'past_leaving_reasons_text',
    label: 'Previous Job Changes',
    placeholder: 'e.g., Career progression, better opportunities, company restructure',
    icon: Briefcase,
    description: 'Reasons for past job changes'
  }
]

export function ProfilePage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [qa, setQa] = useState<RecruiterQA>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  const [joinDateOpen, setJoinDateOpen] = useState(false)
  const [joinDate, setJoinDate] = useState<Date | undefined>(undefined)
  const [internAvailOpen, setInternAvailOpen] = useState(false)
  const [internAvailDate, setInternAvailDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const [p, q] = await Promise.all([
          apiWithToken('/v1/profile', token!),
          apiWithToken('/v1/recruiter-qa', token!)
        ])
        setProfile(p as any)
        // Initialize date picker state from profile date (YYYY-MM-DD)
        if ((p as any)?.earliest_join_date) {
          const d = new Date((p as any).earliest_join_date)
          if (!isNaN(d.getTime())) setJoinDate(d)
        } else {
          setJoinDate(undefined)
        }
        // Initialize intern available date if present
        const pi = (p as any)?.persona_info
        if (pi?.available_from) {
          const d2 = new Date(pi.available_from)
          if (!isNaN(d2.getTime())) setInternAvailDate(d2)
        } else {
          setInternAvailDate(undefined)
        }
        setQa(q as any)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  async function save() {
    setSaving(true)
    try {
      const token = await getToken()
      const { company: _company, ...patchProfile } = (profile || {}) as any
      await Promise.all([
        apiWithToken('/v1/profile', token!, { method: 'PATCH', body: JSON.stringify(patchProfile) }),
        apiWithToken('/v1/recruiter-qa', token!, { method: 'PUT', body: JSON.stringify(qa) })
      ])
      setSaveSuccess(true)
      setEditMode(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  function formatDisplayDate(date: Date | undefined) {
    if (!date) return 'dd/mm/yyyy'
    return date.toLocaleDateString('en-GB')
  }

  function toISODateString(date: Date | undefined) {
    if (!date) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  async function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    // Persist to profile
    try {
      const token = await getToken()
      await apiWithToken('/v1/profile', token!, { method: 'PATCH', body: JSON.stringify({ theme: next }) })
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 min-w-0 max-w-full overflow-hidden hide-scrollbar"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* User Info & Basic Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* User Card */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.imageUrl}
                  alt={user?.fullName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-border"
                />
                <div>
                  <h3 className="font-semibold">{user?.fullName}</h3>
                  <p className="text-muted-foreground text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Profile */}
          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Profile Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Persona Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center space-x-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Persona</span>
                </label>
                <Select
                  value={profile?.persona || ''}
                  onValueChange={(v) => setProfile({ ...profile, persona: (v as any) || null })}
                  disabled={!editMode}
                >
                  <SelectTrigger className="w-[220px] h-8 text-sm">
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Working Professional</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Notice Period (Days)</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!editMode}
                    onClick={() => setProfile({ ...profile, notice_period_days: Math.max(0, (profile?.notice_period_days || 0) - 15) })}
                  >
                    -15
                  </Button>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g., 60"
                    value={profile?.notice_period_days ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      setProfile({ ...profile, notice_period_days: v })
                    }}
                    disabled={!editMode}
                    className="bg-background/50 h-8 text-sm w-28"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!editMode}
                    onClick={() => setProfile({ ...profile, notice_period_days: Math.min(365, (profile?.notice_period_days || 0) + 15) })}
                  >
                    +15
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Your standard notice period in days</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Earliest Join Date</span>
                </label>
                <Popover open={joinDateOpen} onOpenChange={setJoinDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!editMode}
                      className="w-[220px] justify-between font-normal h-8 text-sm"
                    >
                      {formatDisplayDate(joinDate)}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DateCalendar
                      mode="single"
                      selected={joinDate}
                      captionLayout="dropdown"
                      onSelect={(d) => {
                        setJoinDate(d)
                        setJoinDateOpen(false)
                        setProfile({ ...profile, earliest_join_date: toISODateString(d) })
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">When you can start a new role</p>
              </div>
              {/* Persona-specific sections */}
              {profile && profile.persona === 'professional' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Current Role</label>
                    {editMode && profile.company?.id ? (
                      // Role suggestions integrated input when company is selected
                      <RoleSuggestionCombobox
                        companyId={profile.company.id}
                        currentRole={profile.current_role || ''}
                        currentCompany={profile.company.name || profile.current_company || ''}
                        showAsInput
                        inputValue={profile.current_role || ''}
                        onInputValueChange={(v: string) => setProfile({ ...profile, current_role: v })}
                        onChoose={(s) => setProfile({ ...profile, current_role: s.role })}
                        placeholder="e.g., Senior Frontend Engineer"
                        className="h-8 text-sm"
                      />
                    ) : (
                      <Input
                        placeholder="e.g., Senior Frontend Engineer"
                        value={profile.current_role || ''}
                        onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                        disabled={!editMode}
                        className="bg-background/50 h-8 text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Current Company</label>
                    {editMode ? (
                      <CompanySearchCombobox
                        value={profile.company || null}
                        onChange={(c: Company | null) => {
                          setProfile({
                            ...profile,
                            company: c,
                            current_company_id: c?.id ?? null,
                            current_company: c?.name ?? null,
                          })
                        }}
                        placeholder="Search your company..."
                        variant="dialog"
                      />
                    ) : (
                      <Input
                        placeholder="e.g., Acme Corp"
                        value={profile.company?.name || profile.current_company || ''}
                        disabled
                        className="bg-background/50 h-8 text-sm"
                      />
                    )}
                  </div>
                </div>
              )}
              {profile && profile.persona === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Degree</label>
                    <Input
                      placeholder="e.g., B.Tech Computer Science"
                      value={profile.persona_info?.degree || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), degree: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Institution</label>
                    <Input
                      placeholder="e.g., IIT Delhi"
                      value={profile.persona_info?.institution || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), institution: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Graduation Year</label>
                    <Input
                      placeholder="e.g., 2026"
                      value={profile.persona_info?.graduation_year || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), graduation_year: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Major</label>
                    <Input
                      placeholder="e.g., Computer Science"
                      value={profile.persona_info?.major || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), major: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                </div>
              )}
              {profile && profile.persona === 'intern' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Internship Role</label>
                    <Input
                      placeholder="e.g., Frontend Intern"
                      value={profile.persona_info?.role || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), role: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Organization</label>
                    <Input
                      placeholder="e.g., Acme Corp"
                      value={profile.persona_info?.organization || ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), organization: e.target.value } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Available From</label>
                    <Popover open={internAvailOpen} onOpenChange={setInternAvailOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!editMode}
                          className="w-[220px] justify-between font-normal h-8 text-sm"
                        >
                          {formatDisplayDate(internAvailDate)}
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateCalendar
                          mode="single"
                          selected={internAvailDate}
                          captionLayout="dropdown"
                          onSelect={(d) => {
                            setInternAvailDate(d)
                            setInternAvailOpen(false)
                            setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), available_from: toISODateString(d) } })
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Duration (months)</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g., 6"
                      value={profile.persona_info?.duration_months ?? ''}
                      onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), duration_months: e.target.value === '' ? null : Number(e.target.value) } })}
                      disabled={!editMode}
                      className="bg-background/50 h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recruiter Q&A - Spans 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 min-w-0"
        >
          <Card className="border border-border min-w-0 overflow-hidden hide-scrollbar">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-xl truncate">Recruiter Q&A</h3>
                    <p className="text-sm text-muted-foreground truncate">Pre-written responses for common recruiter questions</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  Ready Responses
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 min-w-0">
              <div className="space-y-6">
                {qaFields.map((field, index) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3 p-4 rounded-lg bg-background/30 border border-border/50 min-w-0"
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <field.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <label className="font-medium text-sm block truncate">{field.label}</label>
                          <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                        </div>
                      </div>
                      {qa[field.key as keyof RecruiterQA] && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ready
                        </Badge>
                      )}
                    </div>
                    
                    <textarea
                      placeholder={field.placeholder}
                      value={qa[field.key as keyof RecruiterQA] || ''}
                      onChange={(e) => setQa({ ...qa, [field.key]: e.target.value })}
                      disabled={!editMode}
                      rows={3}
                      className={cn(
                        "w-full min-w-0 max-w-full px-3 py-3 bg-background/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg text-sm resize-none transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                        "overflow-hidden box-border break-words",
                        !editMode && "opacity-70"
                      )}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center space-x-3 justify-end pt-3"
          >
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </Button>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center"
              >
                <span className="text-sm font-medium">Saved successfully!</span>
              </motion.div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <span>{editMode ? 'Cancel' : 'Edit'}</span>
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={saving || !editMode}
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-2 w-2 rounded-full border-2 border-white border-t-transparent"
                />
              ) : (
                <Save className="h-2 w-2" />
              )}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}


