import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Globe, Plus, Search, Star, Trash2 } from 'lucide-react'
import type { Platform, UserPlatform } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthToken } from '@/lib/auth'
import {
  addMyPlatformWithRefresh,
  deleteMyPlatformWithRefresh,
  listMyPlatformsWithRefresh,
  searchPlatformsByNameWithRefresh,
  updateMyPlatformWithRefresh,
  upsertPlatformWithRefresh,
} from '@/lib/api'

type SearchResult = Platform

function Stars({ value, onChange }: { value: number | null | undefined; onChange: (v: number | null) => void }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(value === s ? null : s)}
          className="text-amber-500 hover:scale-105 transition-transform"
          aria-label={`Set rating ${s}`}
        >
          <Star className={`h-4 w-4 ${value && value >= s ? '' : 'opacity-30'}`} />
        </button>
      ))}
    </div>
  )
}

export function ManageUserPlatforms({ analytics }: { analytics?: Record<string, { totals: number; in_progress: number; offers: number; rejects: number }> }) {
  const { getToken } = useAuthToken()
  const [items, setItems] = useState<Array<UserPlatform>>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<SearchResult>>([])
  const [searching, setSearching] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [manualName, setManualName] = useState('')
  const [selectedForEdit, setSelectedForEdit] = useState<UserPlatform | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editRating, setEditRating] = useState<number | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const data = await listMyPlatformsWithRefresh(getToken)
        setItems(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const onSearch = async () => {
    const q = query.trim()
    if (q.length < 3) return
    setSearching(true)
    try {
      const data = await searchPlatformsByNameWithRefresh<Array<SearchResult>>(getToken, q)
      setResults(data)
    } finally {
      setSearching(false)
    }
  }

  const onAddExisting = async (p: Platform) => {
    const created = await addMyPlatformWithRefresh(getToken, { platform_id: p.id })
    setItems((prev) => [created, ...prev.filter((i) => i.id !== created.id)])
    setAddOpen(false)
  }

  const onCreateAndAdd = async () => {
    const url = manualUrl.trim()
    if (!url) return
    const p = await upsertPlatformWithRefresh<Platform>(getToken, { name: manualName.trim(), url })
    const created = await addMyPlatformWithRefresh(getToken, { platform_id: p.id })
    setItems((prev) => [created, ...prev.filter((i) => i.id !== created.id)])
    setManualName('')
    setManualUrl('')
    setAddOpen(false)
  }

  const openEdit = (row: UserPlatform) => {
    setSelectedForEdit(row)
    setEditNotes(row.notes ?? '')
    setEditRating(row.rating ?? null)
  }

  const saveEdit = async () => {
    if (!selectedForEdit) return
    setSavingEdit(true)
    try {
      const updated = await updateMyPlatformWithRefresh(getToken, selectedForEdit.id, { notes: editNotes, rating: editRating })
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelectedForEdit(null)
    } finally {
      setSavingEdit(false)
    }
  }

  const remove = async (row: UserPlatform) => {
    await deleteMyPlatformWithRefresh(getToken, row.id)
    setItems((prev) => prev.filter((i) => i.id !== row.id))
  }

  const empty = useMemo(() => items.length === 0, [items])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card className="border border-border">
        <CardHeader className="border-b border-border flex flex-row items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Your Platforms</CardTitle>
              <p className="text-xs text-muted-foreground">Save platforms you use, rate them, and add notes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5">{items.length} saved</Badge>
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus className="h-3.5 w-3.5" /> <span className='text-xs'>Add</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : empty ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No platforms yet. Add one to get started.</div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((row) => {
                const stats = analytics?.[row.platform_id]
                return (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-muted/10"
                  onClick={() => openEdit(row)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {row.platform?.logo_url ? (
                      <img src={row.platform.logo_url} alt={row.platform.name} className="h-7 w-7 rounded-md border border-border object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-md border border-border flex items-center justify-center bg-muted/30">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate max-w-[240px]">{row.platform?.name ?? row.platform_id}</span>
                        {/* Show rating only if set */}
                        {typeof row.rating === 'number' && row.rating > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: row.rating }).map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 text-amber-500" />
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[420px]">{row.platform?.url}</div>
                      {row.notes ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-[11px] text-muted-foreground truncate max-w-[420px] mt-0.5">Notes: {row.notes}</div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[420px]">
                            <div className="max-w-[400px] whitespace-pre-wrap text-left">{row.notes}</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats ? (
                      <>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{stats.totals} total</Badge>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">{stats.in_progress} active</Badge>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">{stats.totals > 0 ? Math.round((stats.offers / stats.totals) * 100) : 0}% success</Badge>
                      </>
                    ) : null}
                    {/* Delete only if no associated apps */}
                    {(!stats || stats.totals === 0) ? (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); remove(row) }}
                        title="Delete platform"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Search by name</label>
              <div className="mt-1 flex items-center gap-2">
                <Input placeholder="e.g. LinkedIn, Instahyre" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} className="h-9" />
                <Button variant="secondary" onClick={onSearch} disabled={searching} className="h-9">
                  <Search className="h-3.5 w-3.5 mr-2" /> Search
                </Button>
              </div>
              <div className="mt-3 max-h-56 overflow-auto rounded-md border border-border">
                {searching ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No results</div>
                ) : (
                  <div className="divide-y divide-border">
                    {results.map((p) => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-muted/30 flex items-center gap-3" onClick={() => onAddExisting(p)}>
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="h-5 w-5 rounded border border-border object-cover" />
                        ) : (
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{p.url}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <label className="text-[11px] text-muted-foreground">Or create by website URL</label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input className="md:col-span-1 h-9" placeholder="Name (optional)" value={manualName} onChange={(e) => setManualName(e.target.value)} />
                <Input className="md:col-span-2 h-9" placeholder="https://example.com" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" className="h-8" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="h-8" onClick={onCreateAndAdd} disabled={!manualUrl.trim()}>Create & Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!selectedForEdit} onOpenChange={(v) => !v && setSelectedForEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rating</span>
              <Stars value={editRating} onChange={setEditRating} />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Notes</label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Write your notes here…" className="mt-1" rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" className="h-8" onClick={() => setSelectedForEdit(null)}>Cancel</Button>
            <Button className="h-8" onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default ManageUserPlatforms


