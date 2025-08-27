import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Building2, Calendar, Clock, Plus } from 'lucide-react'
import type { ApplicationListItem } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateApplicationModal } from '@/components/CreateApplicationModal'
import { UpdateApplicationModal } from '@/components/UpdateApplicationModal'
import { formatDateIndian } from '@/lib/utils'

export function InterviewingApplicationsPage() {
  const { apiCall } = useApi()
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>()

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiCall<Array<ApplicationListItem>>(`/v1/applications`)
        setApps(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [apiCall])

  const filtered = useMemo(() => apps.filter(a => a.milestone === 'interviewing'), [apps])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Interviewing</h2>
            <p className="text-xs text-muted-foreground">All interview rounds</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">{filtered.length} apps</Badge>
      </div>

      <Card className="shadow-xs">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((app) => (
                <div key={app.id} className="group cursor-pointer px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10" onClick={() => { setSelectedAppId(app.id); setUpdateModalOpen(true) }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {app.company?.logo_url ? (
                        <img src={app.company.logo_url} alt={app.company.name} className="h-8 w-8 rounded-md border border-border object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-medium text-base truncate">{app.company?.name ?? app.company_id.slice(0, 8)}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
                          <span className="truncate">{app.role}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateIndian(app.last_activity_at)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[11px] px-2 py-0.5">{app.stage.name}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No applications yet</div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="fixed bottom-6 right-6 z-40">
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <Button size="icon" className="relative h-14 w-14 rounded-full shadow-lg" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      <CreateApplicationModal open={createModalOpen} onOpenChange={setCreateModalOpen} onCreated={(app: ApplicationListItem) => setApps((prev) => [app, ...prev])} />
      {selectedAppId && (
        <UpdateApplicationModal
          open={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          applicationId={selectedAppId}
          onUpdated={(app: ApplicationListItem) => setApps((prev) => prev.map((a) => (a.id === app.id ? app : a)))}
          onDeleted={(id: string) => setApps((prev) => prev.filter((a) => a.id !== id))}
        />
      )}
    </motion.div>
  )
}

export default InterviewingApplicationsPage
