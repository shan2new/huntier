import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Building2, LinkedinIcon, Mail, MessageSquare, Network, Phone, User, Users } from 'lucide-react'
import { apiWithToken } from '../lib/api'
import { MotionEffect } from '@/components/animate-ui/effects/motion-effect'
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
  channels: Array<{ 
    medium: string; 
    channel_value: string 
  }> 
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
  email: 'bg-secondary text-secondary-foreground',
  phone: 'bg-secondary text-secondary-foreground',
  linkedin: 'bg-secondary text-secondary-foreground',
  whatsapp: 'bg-secondary text-secondary-foreground',
  telegram: 'bg-secondary text-secondary-foreground',
  default: 'bg-secondary text-secondary-foreground',
}

export function ReferrersPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Array<ReferrerRow>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const data = await apiWithToken<Array<ReferrerRow>>('/v1/referrers', token!)
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
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <MotionEffect fade slide={{ direction: 'up', offset: 20 }} className="space-y-8">
      {/* Header */}
      <div className="space-y-2 px-6">
        <div className="mx-auto w-full max-w-6xl">
        <MotionEffect fade slide={{ direction: 'left', offset: 20 }}>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Referrers Network
          </h1>
        </MotionEffect>
        <MotionEffect fade slide={{ direction: 'left', offset: 20 }} delay={0.1}>
          <p className="text-lg text-muted-foreground">
            Manage your professional network and referral contacts
          </p>
        </MotionEffect>
        </div>
      </div>

      {/* Overview Stats */}
      <MotionEffect fade slide={{ direction: 'up', offset: 20 }} delay={0.1} className="px-6">
        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 gap-6 md:grid-cols-3">
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
          <MotionEffect
            key={stat.label}
            fade 
            slide={{ direction: 'up', offset: 20 }}
            delay={index * 0.05}
          >
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionEffect>
        ))}
        </div>
      </MotionEffect>

      {/* Referrers List */}
      <MotionEffect fade slide={{ direction: 'up', offset: 20 }} delay={0.2} className="px-6">
        <Card className="border border-border mx-auto w-full max-w-6xl">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
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
              <MotionEffect fade className="text-center py-16">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-primary/10">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No referrers yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start building your network by adding contacts who can help refer you to companies and opportunities.
                  </p>
                </div>
              </MotionEffect>
            ) : (
              <div className="space-y-4">
                {rows.map((referrer, index) => (
                  <MotionEffect
                    key={referrer.contact.id}
                    fade
                    slide={{ direction: 'left', offset: 20 }}
                    delay={index * 0.05}
                  >
                    <Card className="bg-card/50 hover:bg-card border border-border transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
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
                  </MotionEffect>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </MotionEffect>
    </MotionEffect>
  )
}


