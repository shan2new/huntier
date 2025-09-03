import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Building2, Filter, Globe, Link as LinkIcon, Mail, MessageSquare, MoreHorizontal, Pencil, Phone, Plus, Search, Trash2, User } from 'lucide-react'
import { listContactsWithRefresh, type AggregatedContact, getContactWithRefresh, updateContactWithRefresh, addContactChannelWithRefresh, updateContactChannelWithRefresh, deleteContactChannelWithRefresh } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const channelIconMap: Record<string, any> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageSquare,
  linkedin: LinkIcon,
  default: MessageSquare,
}

type EditableChannel = { id?: string; medium: 'email' | 'linkedin' | 'phone' | 'whatsapp' | 'other'; channel_value: string; _tempId?: string }

export function ContactsPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Array<AggregatedContact>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTitle, setEditTitle] = useState<string>('')
  const [editNotes, setEditNotes] = useState<string>('')
  const [editChannels, setEditChannels] = useState<Array<EditableChannel>>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const getTokenNonNull = async () => {
          const t = await getToken()
          if (!t) throw new Error('Missing auth token')
          return t
        }
        const data = await listContactsWithRefresh(getTokenNonNull)
        setRows(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesText = !q ||
        r.contact.name.toLowerCase().includes(q) ||
        (r.contact.title || '').toLowerCase().includes(q) ||
        r.companies.some(c => (c.name || '').toLowerCase().includes(q))
      const matchesRole = roleFilter === 'all' || r.roles.includes(roleFilter)
      const matchesChannel = channelFilter === 'all' || r.channels.some(ch => ch.medium === channelFilter)
      return matchesText && matchesRole && matchesChannel
    })
  }, [rows, query, roleFilter, channelFilter])

  async function openEditDrawer(id: string) {
    setEditingId(id)
    const getTokenNonNull = async () => {
      const t = await getToken()
      if (!t) throw new Error('Missing auth token')
      return t
    }
    const data = await getContactWithRefresh(getTokenNonNull, id)
    setEditName(data.contact.name || '')
    setEditTitle(data.contact.title || '')
    setEditNotes(data.contact.notes || '')
    setEditChannels(data.channels.map(ch => ({ id: ch.id, medium: ch.medium as any, channel_value: ch.channel_value })))
    setDrawerOpen(true)
  }

  function addChannelChip() {
    const tempId = `tmp-${Date.now()}`
    setEditChannels(prev => [...prev, { _tempId: tempId, medium: 'email', channel_value: '' }])
  }

  function updateChannelChip(idx: number, patch: Partial<EditableChannel>) {
    setEditChannels(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function removeChannelChip(idx: number) {
    setEditChannels(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveEdits() {
    if (!editingId) return
    setSaving(true)
    const getTokenNonNull = async () => {
      const t = await getToken()
      if (!t) throw new Error('Missing auth token')
      return t
    }
    try {
      await updateContactWithRefresh(getTokenNonNull, editingId, { name: editName.trim(), title: editTitle.trim() || null, notes: editNotes.trim() || null })

      // Sync channels: create for those without id, update if changed, delete removed handled optimistically below by comparing with server? We'll perform simple approach:
      const server = await getContactWithRefresh(getTokenNonNull, editingId)
      const byId = new Map(server.channels.map(c => [c.id, c]))

      // Create/update
      for (const ch of editChannels) {
        if (!ch.id) {
          if (!ch.channel_value.trim()) continue
          await addContactChannelWithRefresh(getTokenNonNull, editingId, { medium: ch.medium, channel_value: ch.channel_value.trim() })
        } else {
          const orig = byId.get(ch.id)
          if (!orig) continue
          if (orig.medium !== ch.medium || orig.channel_value !== ch.channel_value) {
            await updateContactChannelWithRefresh(getTokenNonNull, editingId, ch.id, { medium: ch.medium, channel_value: ch.channel_value.trim() })
          }
        }
      }
      // Delete removed
      const currentIds = new Set(editChannels.filter(c => !!c.id).map(c => c.id as string))
      for (const existing of server.channels) {
        if (!currentIds.has(existing.id)) {
          await deleteContactChannelWithRefresh(getTokenNonNull, editingId, existing.id)
        }
      }

      // Refresh list view
      const refreshed = await listContactsWithRefresh(getTokenNonNull)
      setRows(refreshed)
      setDrawerOpen(false)
      setEditingId(null)
      toast.success('Contact updated')
    } catch (e) {
      toast.error('Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  function copy(text: string) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => toast.success('Copied'))
  }

  function openLink(url: string) {
    if (!url) return
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer')
  }

  function startConversation(ch: { medium: string; channel_value: string }) {
    if (ch.medium === 'email') {
      window.location.href = `mailto:${ch.channel_value}`
    } else if (ch.medium === 'phone' || ch.medium === 'whatsapp') {
      window.location.href = `tel:${ch.channel_value}`
    } else if (ch.medium === 'linkedin') {
      openLink(ch.channel_value)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full">
      {/* Header & Filters */}
      <div className="px-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-sm text-muted-foreground">People you interact with across applications</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contacts..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-background border rounded-md px-2 py-1">
                <option value="all">All roles</option>
                <option value="recruiter">Recruiter</option>
                <option value="referrer">Referrer</option>
                <option value="hiring_manager">Hiring manager</option>
                <option value="interviewer">Interviewer</option>
                <option value="other">Other</option>
              </select>
              <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="bg-background border rounded-md px-2 py-1">
                <option value="all">All channels</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 mt-6">
        <div className="px-6 pb-6 mx-auto w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-[180px] animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-sm text-muted-foreground py-20">No contacts yet</div>
          ) : (
            filtered.map((r) => {
              const initials = r.contact.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
              return (
                <Card key={r.contact.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border">
                        <User className="h-5 w-5 text-primary" aria-hidden />
                        <span className="sr-only">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate leading-tight">{r.contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.contact.title || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{r.applications_count}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEditDrawer(r.contact.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Companies */}
                    {r.companies.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <div className="truncate">{r.companies.map(c => c.name).join(', ')}</div>
                      </div>
                    )}

                    {/* Platforms */}
                    {r.platforms.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <div className="truncate">{r.platforms.map(p => p.name).join(', ')}</div>
                      </div>
                    )}

                    {/* Channels with quick actions */}
                    <div className="flex flex-wrap gap-1.5">
                      {r.channels.map((ch, idx) => {
                        const Icon = channelIconMap[ch.medium] || channelIconMap.default
                        return (
                          <div key={ch.medium + idx} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs bg-secondary text-secondary-foreground">
                            <Icon className="h-3 w-3" />
                            <span className="capitalize">{ch.medium}</span>
                            <div className="flex items-center gap-1 ml-1">
                              <button className="opacity-70 hover:opacity-100" onClick={() => copy(ch.channel_value)} title="Copy">
                                <MoreHorizontal className="h-3 w-3 rotate-90" />
                              </button>
                              <button className="opacity-70 hover:opacity-100" onClick={() => startConversation(ch)} title="Start">
                                <LinkIcon className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-1">
                      {r.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[10px] uppercase tracking-wide">{role.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="flex flex-col max-h-[80vh]">
            <DrawerHeader className="px-6 py-4 border-b border-border">
              <DrawerTitle className="text-lg font-semibold tracking-tight">Edit Contact</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Senior Engineer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes about this contact..." className="min-h-[80px] resize-none" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Channels</Label>
                      <Button variant="outline" size="sm" onClick={addChannelChip}><Plus className="h-3 w-3" /> Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editChannels.map((c, idx) => (
                        <div key={(c.id || c._tempId) as string} className="flex items-center gap-2 rounded-md border px-2 py-1">
                          <select value={c.medium} onChange={(e) => updateChannelChip(idx, { medium: e.target.value as any })} className="bg-background border rounded-md px-1 py-0.5 text-xs">
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="other">Other</option>
                          </select>
                          <Input value={c.channel_value} onChange={(e) => updateChannelChip(idx, { channel_value: e.target.value })} placeholder="value" className="h-7" />
                          <Button variant="ghost" size="icon" onClick={() => removeChannelChip(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
            <DrawerFooter className="border-t border-border bg-background/30">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                <Button onClick={saveEdits} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  )
}

export default ContactsPage


