import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Edit, FileText, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthToken } from '@/lib/auth'
import { deleteResumeWithRefresh, getResumesWithRefresh } from '@/lib/api'

interface Resume {
  id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
  // Optional resume data used for card display
  personal_info?: { fullName?: string } | null
  sections?: Array<any>
  experience?: Array<any>
}

export function ResumeList() {
  const [resumes, setResumes] = useState<Array<Resume>>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuthToken()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const resumesResp = await getResumesWithRefresh(getToken)
        setResumes(resumesResp as Array<Resume>)
      } catch (e) {
        console.error('Failed to load resumes', e)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getResumeOwnerName = (resume: Resume) => {
    return (resume.personal_info?.fullName && resume.personal_info.fullName.trim())
      ? resume.personal_info.fullName
      : (resume.name || 'Untitled Resume')
  }

  const getLatestRole = (resume: Resume) => {
    const fromSections: Array<any> = Array.isArray(resume.sections)
      ? (resume.sections.find((s: any) => s?.type === 'experience')?.content || [])
      : []
    const fromRoot: Array<any> = Array.isArray(resume.experience) ? resume.experience : []
    const all: Array<any> = [...fromSections, ...fromRoot].filter(Boolean)
    if (all.length === 0) return ''

    const parseDateVal = (val?: string) => {
      if (!val) return 0
      const s = String(val)
      if (/present/i.test(s)) return Date.now() + 1e12
      const t = Date.parse(s)
      return Number.isNaN(t) ? 0 : t
    }

    let latest = all[0]
    let best = Math.max(parseDateVal(all[0]?.endDate), parseDateVal(all[0]?.startDate))
    for (let i = 1; i < all.length; i++) {
      const score = Math.max(parseDateVal(all[i]?.endDate), parseDateVal(all[i]?.startDate))
      if (score > best) {
        latest = all[i]
        best = score
      }
    }
    return (latest?.role && String(latest.role).trim()) || ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full py-8 max-w-6xl mx-auto pt-8"
    >
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage your professional resumes
          </p>
        </div>
        <Link to="/resumes/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Resume
          </Button>
        </Link>
      </motion.div>

      {resumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card className="border-dashed">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Get started by creating your first professional resume.
              </p>
              <Link to="/resumes/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Resume
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          <AnimatePresence>
          {resumes.map((resume: Resume, index: number) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
              className="flex"
            >
            <Card className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-shadow duration-300 border bg-gradient-to-br from-background via-background to-muted/30 aspect-[1.6/1] flex-1">
              {/* Business card design */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                {/* Header with resume name and badge */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg tracking-tight leading-tight truncate text-foreground">
                      {resume.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {formatDate(resume.updated_at)}
                    </p>
                  </div>
                  {resume.is_default && (
                    <div className="ml-3 shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-primary text-primary-foreground">
                        Default
                      </span>
                    </div>
                  )}
                </div>

                {/* Owner name and latest role from resume (no avatar) */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold tracking-tight text-foreground truncate">
                      {getResumeOwnerName(resume)}
                    </div>
                    {getLatestRole(resume) && (
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">
                        {getLatestRole(resume)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Decorative bottom accent */}
                <div className="absolute bottom-0 left-6 right-6 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full" />
              </div>

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Link to={`/resumes/${resume.id}`} className="inline-flex">
                    <Button variant="secondary" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Resume
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    disabled={deletingId === resume.id}
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!confirm('Delete this resume?')) return
                      setDeletingId(resume.id)
                      try {
                        await deleteResumeWithRefresh(resume.id, getToken)
                        setResumes((prev) => prev.filter((r) => r.id !== resume.id))
                      } finally {
                        setDeletingId(null)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
