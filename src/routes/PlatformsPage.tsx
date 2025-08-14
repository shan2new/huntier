import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiWithToken } from '../lib/api'
import { motion } from 'framer-motion'
import { Globe, TrendingUp, Award, XCircle, Clock, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PlatformRow = {
  platform_id: string
  totals: number
  offers: number
  rejects: number
  in_progress: number
}

const platformIcons: { [key: string]: string } = {
  'LinkedIn': '💼',
  'Instahyre': '🚀',
  'Naukri': '📋',
  'AngelList': '👼',
  'Wellfound': '🌟',
  'Indeed': '🔍',
  'TopHire': '🎯',
  'Cutshort': '✂️',
  'Uplers': '⬆️',
  'Other': '🌐'
}

export function PlatformsPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<PlatformRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<PlatformRow[]>('/v1/analytics/platforms', token!)
        setRows(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const totalApplications = rows.reduce((sum, row) => sum + row.totals, 0)
  const totalOffers = rows.reduce((sum, row) => sum + row.offers, 0)

  const totalInProgress = rows.reduce((sum, row) => sum + row.in_progress, 0)

  const getSuccessRate = (offers: number, totals: number) => {
    return totals > 0 ? Math.round((offers / totals) * 100) : 0
  }

  const getProgressRate = (inProgress: number, totals: number) => {
    return totals > 0 ? Math.round((inProgress / totals) * 100) : 0
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
      className="space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          Platform Analytics
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Track your success across different job platforms and optimize your strategy
        </motion.p>
      </div>

      {/* Overview Stats */}
      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { 
            label: 'Total Applications', 
            value: totalApplications, 
            icon: BarChart3, 
            gradient: 'from-blue-500 to-indigo-600',
            description: 'Across all platforms'
          },
          { 
            label: 'Success Rate', 
            value: `${totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 100) : 0}%`, 
            icon: Award, 
            gradient: 'from-emerald-500 to-green-600',
            description: 'Applications to offers'
          },
          { 
            label: 'In Progress', 
            value: totalInProgress, 
            icon: Clock, 
            gradient: 'from-amber-500 to-orange-600',
            description: 'Currently active'
          },
          { 
            label: 'Total Offers', 
            value: totalOffers, 
            icon: TrendingUp, 
            gradient: 'from-purple-500 to-pink-600',
            description: 'Successful outcomes'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="glass shadow-soft hover:shadow-soft-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl bg-gradient-to-br shadow-soft", stat.gradient)}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Platform Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass shadow-soft-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Platform Performance</h3>
                  <p className="text-sm text-muted-foreground">Compare your success across different job platforms</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {rows.length} platforms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {rows.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No platform data yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start applying through different platforms to see analytics and performance metrics here.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {rows.map((platform, index) => {
                  const successRate = getSuccessRate(platform.offers, platform.totals)
                  const progressRate = getProgressRate(platform.in_progress, platform.totals)
                  const platformName = platform.platform_id.slice(0, 8) + '...'
                  
                  return (
                    <motion.div
                      key={platform.platform_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <Card className="bg-card/50 hover:bg-card border border-border/50 hover:border-primary/20 transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                                  {platformIcons[platform.platform_id] || platformIcons['Other']}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg truncate">{platformName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                                  <span>{platform.totals} applications</span>
                                  <span>•</span>
                                  <span>{successRate}% success rate</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Award className="h-4 w-4 text-emerald-600" />
                                  <span className="text-lg font-bold text-emerald-600">{platform.offers}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Offers</p>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Clock className="h-4 w-4 text-amber-600" />
                                  <span className="text-lg font-bold text-amber-600">{platform.in_progress}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">In Progress</p>
                              </div>
                              
                              <div className="text-center">
                                <div className="flex items-center space-x-1 mb-1">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-lg font-bold text-red-600">{platform.rejects}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Rejected</p>
                              </div>

                              <div className="flex flex-col space-y-1">
                                <Badge 
                                  className={cn(
                                    "text-xs font-medium",
                                    successRate >= 20 ? "bg-emerald-100 text-emerald-800" :
                                    successRate >= 10 ? "bg-amber-100 text-amber-800" :
                                    "bg-red-100 text-red-800"
                                  )}
                                >
                                  {successRate}% success
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {progressRate}% active
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}


