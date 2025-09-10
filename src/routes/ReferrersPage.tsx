import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Building2, LinkedinIcon, Mail, MessageSquare, Network, Phone, User, Users, Plus, Trash2 } from 'lucide-react'
import { apiWithToken, createReferrerWithRefresh } from '../lib/api'
import { MotionEffect } from '@/components/animate-ui/effects/motion-effect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Company } from '@/lib/api'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'

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
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newChannels, setNewChannels] = useState<Array<{ _tempId?: string; medium: 'email' | 'linkedin' | 'phone' | 'whatsapp' | 'other'; channel_value: string }>>([])
  const [selectedCompanies, setSelectedCompanies] = useState<Array<Company>>([])

  const fetchReferrers = React.useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const data = await apiWithToken<Array<ReferrerRow>>('/v1/referrers', token!)
      setRows(data)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchReferrers()
  }, [fetchReferrers])

  // no-op additional effect needed for companies; selection handled via combobox

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
    <MotionEffect fade slide={{ direction: 'up', offset: 20 }} className="relative space-y-8 h-full">
      {/* Header */}
      <div className="mx-auto pt-8 max-w-6xl">
        <div className="flex items-center justify-between px-2 md:px-0 mb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Referrers</h1>
            <p className="text-sm text-muted-foreground">Manage your professional network and referral contacts</p>
          </div>
          <Button size="sm" onClick={() => { setCreateOpen(true); setNewName(''); setNewTitle(''); setNewChannels([]) }}>
            <Plus className="h-3 w-3" /> Add Referrer
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <MotionEffect fade slide={{ direction: 'up', offset: 20 }} delay={0.1} className="px-2 md:px-0 mx-auto w-full max-w-6xl">
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-6">
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
            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
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
      <MotionEffect fade slide={{ direction: 'up', offset: 20 }} delay={0.2} className="px-2 md:px-0 mx-auto w-full max-w-6xl">
        <Card className="shadow-xs">
          <CardHeader className="border-b border-border px-2">
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
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <MotionEffect fade className="text-center py-12">
                <div className="mb-4">
                  <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No referrers yet</h3>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    Start building your network by adding contacts who can help refer you to opportunities.
                  </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-3 w-3" /> Add Referrer
                </Button>
              </MotionEffect>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((referrer, index) => (
                  <MotionEffect
                    key={referrer.contact.id}
                    fade
                    slide={{ direction: 'left', offset: 20 }}
                    delay={index * 0.03}
                  >
                    <div className="group px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="font-medium text-base text-foreground truncate">{referrer.contact.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {referrer.contact.title && (
                                <>
                                  <span className="truncate">{referrer.contact.title}</span>
                                  <span>•</span>
                                </>
                              )}
                              <div className="flex items-center gap-1 min-w-0">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{referrer.company?.name || 'No company'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {referrer.channels.map((channel) => {
                              const IconComponent = channelIcons[channel.medium.toLowerCase()] || channelIcons.default
                              const colorClass = channelColors[channel.medium.toLowerCase()] || channelColors.default
                              return (
                                <Badge 
                                  key={channel.medium + channel.channel_value}
                                  className={cn("text-[11px] font-medium flex items-center gap-1", colorClass)}
                                >
                                  <IconComponent className="h-3 w-3" />
                                  <span className="capitalize">{channel.medium}</span>
                                </Badge>
                              )
                            })}
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-muted-foreground mb-0.5">Contact Methods</p>
                            <p className="text-base font-semibold">{referrer.channels.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </MotionEffect>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </MotionEffect>

      {/* Create Referrer Drawer */}
      <Drawer open={createOpen} onOpenChange={setCreateOpen}>
        <DrawerContent>
          <div className="flex flex-col max-h-[80vh]">
            <DrawerHeader className="px-6 py-4 border-b border-border">
              <DrawerTitle className="text-lg font-semibold tracking-tight">Add Referrer</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new_name">Name</Label>
                    <Input id="new_name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_title">Title</Label>
                    <Input id="new_title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Senior Engineer" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Channels</Label>
                      <Button variant="outline" size="sm" onClick={() => setNewChannels((prev) => [...prev, { _tempId: `tmp-${Date.now()}`, medium: 'email', channel_value: '' }])}><Plus className="h-3 w-3" /> Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newChannels.map((c, idx) => (
                        <div key={(c._tempId || `${idx}`) as string} className="flex items-center gap-2 rounded-md border px-2 py-1">
                          <select value={c.medium} onChange={(e) => setNewChannels(prev => prev.map((x, i) => i === idx ? { ...x, medium: e.target.value as any } : x))} className="bg-background border rounded-md px-1 py-0.5 text-xs">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="other">Other</option>
                          </select>
                          <Input value={c.channel_value} onChange={(e) => setNewChannels(prev => prev.map((x, i) => i === idx ? { ...x, channel_value: e.target.value } : x))} placeholder="value" className="h-7" />
                          <Button variant="ghost" size="icon" onClick={() => setNewChannels(prev => prev.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Companies */}
                  <div className="space-y-2">
                    <Label>Companies (optional)</Label>
                    {selectedCompanies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCompanies.map((c) => (
                          <Badge key={c.id} variant="secondary" className="px-2 py-0.5 text-xs inline-flex items-center gap-1">
                            {c.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => setSelectedCompanies((prev) => prev.filter((x) => x.id !== c.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CompanySearchCombobox
                      value={null}
                      onChange={(company) => {
                        if (!company) return
                        setSelectedCompanies((prev) => (prev.find((x) => x.id === company.id) ? prev : [...prev, company]))
                      }}
                      placeholder="Search and add companies"
                      className="w-full"
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>
            <DrawerFooter className="border-t border-border bg-background/30">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  const getTokenNonNull = async () => { const t = await getToken(); if (!t) throw new Error('Missing auth token'); return t }
                  try {
                    await createReferrerWithRefresh(getTokenNonNull, {
                      name: newName.trim(),
                      title: newTitle.trim() || null,
                      channels: newChannels.filter(c => c.channel_value.trim()).map(c => ({ medium: c.medium, channel_value: c.channel_value.trim() })),
                      company_ids: selectedCompanies.map((c) => c.id),
                    })
                    await fetchReferrers()
                    setCreateOpen(false)
                  } catch {
                    // silently fail, optionally show toast
                  }
                }} disabled={!newName.trim()}>Save</Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </MotionEffect>
  )
}


