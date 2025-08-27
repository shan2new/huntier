import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { 
  Briefcase, 
  Building2,
  CheckCircle, 
  ChevronDown,
  Clock, 
  DollarSign, 
  Edit3,
  MessageSquare, 
  Save,
  Settings,
  Target,
  TrendingUp,
  User,
  X
} from 'lucide-react'
import type { Company, UserProfile } from '@/lib/api'
import { useApi } from '@/lib/use-api'
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
import { Separator } from '@/components/ui/separator'

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
  const { apiCall } = useApi()
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
        const [p, q] = await Promise.all([
          apiCall('/v1/profile'),
          apiCall('/v1/recruiter-qa')
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
      const { company: _company, ...patchProfile } = (profile || {}) as any
      await Promise.all([
        apiCall('/v1/profile', { method: 'PATCH', body: JSON.stringify(patchProfile) }),
        apiCall('/v1/recruiter-qa', { method: 'PUT', body: JSON.stringify(qa) })
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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
      await apiCall('/v1/profile', { method: 'PATCH', body: JSON.stringify({ theme: next }) })
    } catch {}
  }

  const completedQAs = Object.values(qa).filter(v => v && v.trim()).length
  const totalQAs = qaFields.length

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
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and recruiter responses</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          {editMode ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={saving}
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent mr-2"
                  />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 dark:text-green-200 font-medium">Profile saved successfully!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info & Basic Settings */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={user?.imageUrl}
                  alt={user?.fullName || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-border"
                />
                <div>
                  <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                  <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Persona */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Persona</label>
                <Select
                  value={profile?.persona || ''}
                  onValueChange={(v) => setProfile({ ...profile, persona: (v as any) || null })}
                  disabled={!editMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Working Professional</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notice Period */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notice Period (Days)</label>
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
                    placeholder="60"
                    value={profile?.notice_period_days ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : Number(e.target.value)
                      setProfile({ ...profile, notice_period_days: v })
                    }}
                    disabled={!editMode}
                    className="w-24 text-center"
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

              {/* Earliest Join Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Earliest Join Date</label>
                <Popover open={joinDateOpen} onOpenChange={setJoinDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!editMode}
                      className="w-full justify-between"
                    >
                      {formatDisplayDate(joinDate)}
                      <ChevronDown className="h-4 w-4" />
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

              {/* Persona-specific fields */}
              {profile && profile.persona === 'professional' && (
                <div className="space-y-4">
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Role</label>
                      {editMode && profile.company?.id ? (
                        <RoleSuggestionCombobox
                          companyId={profile.company.id}
                          currentRole={profile.current_role || ''}
                          currentCompany={profile.company.name || profile.current_company || ''}
                          showAsInput
                          inputValue={profile.current_role || ''}
                          onInputValueChange={(v: string) => setProfile({ ...profile, current_role: v })}
                          onChoose={(s) => setProfile({ ...profile, current_role: s.role })}
                          placeholder="e.g., Senior Frontend Engineer"
                        />
                      ) : (
                        <Input
                          placeholder="e.g., Senior Frontend Engineer"
                          value={profile.current_role || ''}
                          onChange={(e) => setProfile({ ...profile, current_role: e.target.value })}
                          disabled={!editMode}
                        />
                      )}
                    </div>
                                         <div className="space-y-2">
                       <label className="text-sm font-medium">Current Company</label>
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
                         <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border border-border rounded-md">
                           {profile.company?.logo_url ? (
                             <img 
                               src={profile.company.logo_url} 
                               alt={profile.company.name || 'Company'} 
                               className="w-5 h-5 rounded-sm object-cover border border-border"
                             />
                           ) : (
                             <div className="w-5 h-5 rounded-sm bg-muted-foreground/20 flex items-center justify-center">
                               <Building2 className="h-3 w-3 text-muted-foreground" />
                             </div>
                           )}
                           <span className="text-sm text-foreground">
                             {profile.company?.name || profile.current_company || 'No company set'}
                           </span>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              )}

              {profile && profile.persona === 'student' && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Degree</label>
                      <Input
                        placeholder="e.g., B.Tech Computer Science"
                        value={profile.persona_info?.degree || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), degree: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Institution</label>
                      <Input
                        placeholder="e.g., IIT Delhi"
                        value={profile.persona_info?.institution || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), institution: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Graduation Year</label>
                      <Input
                        placeholder="e.g., 2026"
                        value={profile.persona_info?.graduation_year || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), graduation_year: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Major</label>
                      <Input
                        placeholder="e.g., Computer Science"
                        value={profile.persona_info?.major || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), major: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>
              )}

              {profile && profile.persona === 'intern' && (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Internship Role</label>
                      <Input
                        placeholder="e.g., Frontend Intern"
                        value={profile.persona_info?.role || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), role: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organization</label>
                      <Input
                        placeholder="e.g., Acme Corp"
                        value={profile.persona_info?.organization || ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), organization: e.target.value } })}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available From</label>
                      <Popover open={internAvailOpen} onOpenChange={setInternAvailOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!editMode}
                            className="w-full justify-between"
                          >
                            {formatDisplayDate(internAvailDate)}
                            <ChevronDown className="h-4 w-4" />
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (months)</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g., 6"
                        value={profile.persona_info?.duration_months ?? ''}
                        onChange={(e) => setProfile({ ...profile, persona_info: { ...(profile.persona_info || {}), duration_months: e.target.value === '' ? null : Number(e.target.value) } })}
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recruiter Q&A */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Recruiter Q&A</h3>
                    <p className="text-sm text-muted-foreground">Pre-written responses for common recruiter questions</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {completedQAs}/{totalQAs} Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {qaFields.map((field, index) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <field.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <label className="font-medium text-sm">{field.label}</label>
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      </div>
                    </div>
                    {qa[field.key as keyof RecruiterQA] && (
                      <Badge variant="outline" className="text-xs">
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
                      "w-full px-4 py-3 bg-background border border-border rounded-lg text-sm resize-none transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                      !editMode && "opacity-70 cursor-not-allowed"
                    )}
                  />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage


