import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiWithToken } from '../lib/api'
import { motion } from 'framer-motion'
import { 
  User, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  Briefcase, 
  Clock, 
  Target,
  TrendingUp,

  Save,
  Edit3,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Profile {
  notice_period_days?: number | null
  earliest_join_date?: string | null
}

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
      await Promise.all([
        apiWithToken('/v1/profile', token!, { method: 'PATCH', body: JSON.stringify(profile) }),
        apiWithToken('/v1/recruiter-qa', token!, { method: 'PUT', body: JSON.stringify(qa) })
      ])
      setSaveSuccess(true)
      setEditMode(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
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
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-muted-foreground">Manage your professional profile and recruiter responses</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-3"
        >
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-emerald-600"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Saved successfully!</span>
            </motion.div>
          )}
          
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>{editMode ? 'Cancel' : 'Edit'}</span>
          </Button>
          
          <Button
            onClick={save}
            disabled={saving || !editMode}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 space-x-2"
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* User Info & Basic Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* User Card */}
          <Card className="glass shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.imageUrl}
                  alt={user?.fullName || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-border/50"
                />
                <div>
                  <h3 className="font-semibold">{user?.fullName}</h3>
                  <p className="text-muted-foreground text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Profile */}
          <Card className="glass shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                  <Settings className="h-3.5 w-3.5 text-white" />
                </div>
                <span>Profile Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center space-x-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Notice Period (Days)</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 60"
                  value={profile?.notice_period_days || ''}
                  onChange={(e) => setProfile({ ...profile, notice_period_days: Number(e.target.value) || null })}
                  disabled={!editMode}
                  className="bg-background/50 h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">Your standard notice period in days</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Earliest Join Date</span>
                </label>
                <Input
                  type="date"
                  value={profile?.earliest_join_date || ''}
                  onChange={(e) => setProfile({ ...profile, earliest_join_date: e.target.value || null })}
                  disabled={!editMode}
                  className="bg-background/50 h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">When you can start a new role</p>
              </div>
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
          <Card className="glass shadow-soft-lg min-w-0 overflow-hidden hide-scrollbar">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-white" />
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
                    className="space-y-3 p-4 rounded-lg bg-background/30 border border-border/30 min-w-0"
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex-shrink-0">
                          <field.icon className="h-4 w-4 text-white" />
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
                        "w-full min-w-0 max-w-full px-3 py-3 bg-background/50 border border-border/50 rounded-lg text-sm resize-none transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                        "overflow-hidden box-border break-words",
                        !editMode && "opacity-70"
                      )}
                    />
                  </motion.div>
                ))}
              </div>

              {!editMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 bg-blue-50 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary mb-1">Pro Tip</h4>
                      <p className="text-sm text-muted-foreground">
                        Having pre-written responses helps you quickly reply to recruiters and maintain consistency across conversations.
                        Click "Edit" to update your responses.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}


