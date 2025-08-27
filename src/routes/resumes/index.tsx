import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Edit, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthToken } from '@/lib/auth'
import { getResumesWithRefresh } from '@/lib/api'

interface Resume {
  id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export function ResumeList() {
  const [resumes, setResumes] = useState<Array<Resume>>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuthToken()

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 max-w-6xl mx-auto pt-8">
      <div className="flex justify-between items-center mb-8">
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
      </div>

      {resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume: Resume) => (
            <Card key={resume.id} className="group hover:shadow-md transition-all border-border/80 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors">{resume.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Updated {formatDate(resume.updated_at)}</CardDescription>
                  </div>
                  {resume.is_default && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Default</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {/* miniature preview */}
                <div className="relative rounded-md border border-border/80 bg-gradient-to-br from-muted/40 to-background h-24 overflow-hidden">
                  <div className="absolute inset-0 grid grid-rows-3 grid-cols-6 gap-1 opacity-60 p-2">
                    <div className="col-span-4 h-2 bg-muted rounded" />
                    <div className="col-span-2 h-2 bg-muted/70 rounded" />
                    <div className="col-span-6 h-1 bg-muted/50 rounded" />
                    <div className="col-span-3 h-1 bg-muted/50 rounded" />
                    <div className="col-span-5 h-1 bg-muted/50 rounded" />
                  </div>
                </div>
                <Link to={`/resumes/${resume.id}`}>
                  <Button variant="outline" className="w-full mt-3">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Resume
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
