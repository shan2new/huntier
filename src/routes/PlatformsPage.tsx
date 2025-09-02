import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Award, BarChart3, Clock, Globe, TrendingUp } from 'lucide-react'
import { useApi } from '../lib/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ManageUserPlatforms } from '@/components/platforms/ManageUserPlatforms'

type PlatformRow = {
  platform_id: string
  totals: number
  offers: number
  rejects: number
  in_progress: number
}

// const platformIcons: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
//   LinkedIn: Globe,
//   Instahyre: TrendingUp,
//   Naukri: BarChart3,
//   AngelList: Award,
//   Wellfound: Award,
//   Indeed: Globe,
//   TopHire: TrendingUp,
//   Cutshort: Globe,
//   Uplers: TrendingUp,
//   Other: Globe,
// }

export function PlatformsPage() {
  const { apiCall } = useApi()
  const [rows, setRows] = useState<Array<PlatformRow>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await apiCall<Array<PlatformRow>>('/v1/analytics/platforms')
        setRows(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [apiCall]) // Removed getToken from dependencies since it's memoized


  const totalApplications = rows.reduce((sum, row) => sum + row.totals, 0)
  const totalOffers = rows.reduce((sum, row) => sum + row.offers, 0)

  const totalInProgress = rows.reduce((sum, row) => sum + row.in_progress, 0)

  // helper retained if needed for future inline calcs

  // const getProgressRate = (inProgress: number, totals: number) => {
  //   return totals > 0 ? Math.round((inProgress / totals) * 100) : 0
  // }

  // No platform map needed; user platforms return hydrated relations

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto pt-8 space-y-3 max-w-[1100px] md:max-w-[900px] lg:max-w-[1024px] xl-max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Platforms</h2>
            <p className="text-xs text-muted-foreground">Analytics and saved platforms</p>
          </div>
        </div>
      </div>

      {/* Overview Stats (compact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Applications', value: totalApplications, icon: BarChart3 },
          { label: 'Success Rate', value: `${totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 100) : 0}%`, icon: Award },
          { label: 'Screening', value: totalInProgress, icon: Clock },
          { label: 'Total Offers', value: totalOffers, icon: TrendingUp },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                  </div>
                  <div className="p-2 rounded-md bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Unified listing (ManageUserPlatforms shows analytics inline) */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <ManageUserPlatforms analytics={Object.fromEntries(rows.map(r => [r.platform_id, { totals: r.totals, in_progress: r.in_progress, offers: r.offers, rejects: r.rejects }]))} />
      </ScrollArea>
    </motion.div>
  )
}


