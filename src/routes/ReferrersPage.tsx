import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiWithToken } from '../lib/api'
import { motion } from 'framer-motion'
import { Users, User, Building2, Mail, Phone, MessageSquare, LinkedinIcon, ExternalLink, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ReferrerRow = { 
  contact: { 
    id: string; 
    name: string; 
    title?: string | null 
  }; 
  company?: { 
    id: string; 
    name: string 
  } | null; 
  channels: { 
    medium: string; 
    channel_value: string 
  }[] 
}

const channelIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'email': Mail,
  'phone': Phone,
  'linkedin': LinkedinIcon,
  'whatsapp': MessageSquare,
  'telegram': MessageSquare,
  'default': MessageSquare
}

const channelColors: { [key: string]: string } = {
  'email': 'bg-blue-100 text-blue-800',
  'phone': 'bg-green-100 text-green-800',
  'linkedin': 'bg-blue-100 text-blue-800',
  'whatsapp': 'bg-emerald-100 text-emerald-800',
  'telegram': 'bg-sky-100 text-sky-800',
  'default': 'bg-gray-100 text-gray-800'
}

export function ReferrersPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<ReferrerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<ReferrerRow[]>('/v1/referrers', token!)
        setRows(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const totalReferrers = rows.length
  const companiesCount = new Set(rows.filter(r => r.company).map(r => r.company!.id)).size
  const channelsCount = rows.reduce((total, r) => total + r.channels.length, 0)

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
          Referrers Network
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground"
        >
          Manage your professional network and referral contacts
        </motion.p>
      </div>

      {/* Overview Stats */}
      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { 
            label: 'Total Referrers', 
            value: totalReferrers, 
            icon: Users, 
            gradient: 'from-blue-500 to-indigo-600',
            description: 'People in your network'
          },
          { 
            label: 'Companies', 
            value: companiesCount, 
            icon: Building2, 
            gradient: 'from-emerald-500 to-green-600',
            description: 'Unique companies'
          },
          { 
            label: 'Contact Channels', 
            value: channelsCount, 
            icon: Network, 
            gradient: 'from-purple-500 to-pink-600',
            description: 'Ways to connect'
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

      {/* Referrers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass shadow-soft-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Your Network</h3>
                  <p className="text-sm text-muted-foreground">Professional contacts who can help with referrals</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {rows.length} contacts
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
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No referrers yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start building your network by adding contacts who can help refer you to companies and opportunities.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {rows.map((referrer, index) => (
                  <motion.div
                    key={referrer.contact.id}
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
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg">{referrer.contact.name}</h4>
                              <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                                {referrer.contact.title && (
                                  <>
                                    <span>{referrer.contact.title}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <div className="flex items-center space-x-1">
                                  <Building2 className="h-3 w-3" />
                                  <span>{referrer.company?.name || 'No company'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-wrap gap-2 max-w-xs">
                              {referrer.channels.map((channel) => {
                                const IconComponent = channelIcons[channel.medium.toLowerCase()] || channelIcons.default
                                const colorClass = channelColors[channel.medium.toLowerCase()] || channelColors.default
                                
                                return (
                                  <Badge 
                                    key={channel.medium + channel.channel_value}
                                    className={cn("text-xs font-medium flex items-center space-x-1", colorClass)}
                                  >
                                    <IconComponent className="h-3 w-3" />
                                    <span>{channel.medium}</span>
                                  </Badge>
                                )
                              })}
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Contact Methods</p>
                              <p className="text-lg font-bold">{referrer.channels.length}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}


