import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, FolderTree, Plus, Search, Trash2, X } from 'lucide-react'
import type { Company, CompanyGroup, UserCompanyTarget } from '@/lib/api'
import { addMyCompanyTargetWithRefresh, createMyCompanyGroupWithRefresh, deleteMyCompanyGroupWithRefresh, deleteMyCompanyTargetWithRefresh, listMyCompanyGroupsWithRefresh, listMyCompanyTargetsWithRefresh, updateMyCompanyGroupWithRefresh, updateMyCompanyTargetGroupWithRefresh } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'
import { Link } from '@tanstack/react-router'

export function CompanyGroupsPage() {
  const { getToken } = useAuthToken()
  const [groups, setGroups] = useState<Array<CompanyGroup>>([])
  const [targets, setTargets] = useState<Array<UserCompanyTarget & { company?: Company | null }>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [pickerByGroup, setPickerByGroup] = useState<Record<string, Company | null>>({})
  const [draggedTargetId, setDraggedTargetId] = useState<string | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const [gs, ts] = await Promise.all([
        listMyCompanyGroupsWithRefresh(getToken),
        listMyCompanyTargetsWithRefresh(getToken),
      ])
      setGroups(gs)
      setTargets(ts as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onCreateGroup() {
    // Create with a sensible default name; user can rename inline
    const base = 'New group'
    let name = base
    const existing = new Set(groups.map(g => g.name.toLowerCase()))
    let counter = 2
    while (existing.has(name.toLowerCase())) {
      name = `${base} ${counter++}`
    }
    await createMyCompanyGroupWithRefresh(getToken, { name, sort_order: groups.length })
    await refresh()
  }

  async function onRename(id: string, name: string) {
    await updateMyCompanyGroupWithRefresh(getToken, id, { name })
    await refresh()
  }

  async function onDelete(id: string) {
    await deleteMyCompanyGroupWithRefresh(getToken, id)
    await refresh()
  }

  const targetsByGroup = useMemo(() => {
    const map = new Map<string | null, Array<UserCompanyTarget & { company?: Company | null }>>()
    for (const t of targets) {
      const key = t.group_id || null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [targets])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(g => g.name.toLowerCase().includes(q))
  }, [groups, query])

  async function onRemoveTarget(targetId: string) {
    const prev = targets
    setTargets((p) => p.filter(t => t.id !== targetId))
    try {
      await deleteMyCompanyTargetWithRefresh(getToken, targetId)
    } catch {
      setTargets(prev)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 w-full h-full">
      <div className="mx-auto max-w-6xl flex justify-center w-full px-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-6xl">
          {filteredGroups.map((g) => {
            const items = targetsByGroup.get(g.id) || []
            const isDroppingHere = dragOverGroupId === g.id
            return (
              <div key={g.id} className="mb-2">
                <div className="flex items-center justify-between px-2 md:px-0 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <FolderTree className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        <input defaultValue={g.name} onBlur={(e) => onRename(g.id, e.target.value)} className="bg-transparent outline-none border-b border-transparent focus:border-border" />
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to="/companies/groups/$groupId" params={{ groupId: g.id }} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border hover:bg-muted">
                      <span>Open</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                    <span className="inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border">{items.length}</span>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(g.id)} aria-label="Delete group">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Card className={`shadow-xs ${isDroppingHere ? 'ring-1 ring-primary/30 border-primary/50' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); if (draggedTargetId) setDragOverGroupId(g.id) }}
                  onDragLeave={() => { if (dragOverGroupId === g.id) setDragOverGroupId(null) }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    const id = draggedTargetId
                    setDragOverGroupId(null)
                    setDraggedTargetId(null)
                    if (!id) return
                    // Optimistic move
                    const prev = targets
                    const target = prev.find(t => t.id === id)
                    if (!target) return
                    if (target.group_id === g.id) return
                    setTargets(prev.map(t => t.id === id ? { ...t, group_id: g.id } as any : t))
                    try {
                      await updateMyCompanyTargetGroupWithRefresh(getToken, id, g.id)
                    } catch {
                      setTargets(prev)
                    }
                  }}
                >
                  <CardContent className="p-0">
                    {/* Inline add row */}
                    <div className="px-4 py-3 md:px-6 md:py-4">
                      <CompanySearchCombobox
                        value={pickerByGroup[g.id] || null}
                        onChange={async (c) => {
                          setPickerByGroup((prev) => ({ ...prev, [g.id]: c }))
                          if (c) {
                            const optimisticId = `temp-${Date.now()}-${c.id}`
                            const optimistic = { id: optimisticId, user_id: 'optimistic', company_id: c.id, group_id: g.id, company: c } as any
                            setTargets((prev) => [...prev, optimistic])
                            try {
                              const created = await addMyCompanyTargetWithRefresh(getToken, { company_id: c.id, group_id: g.id }) as any
                              setTargets((prev) => prev.map(t => t.id === optimisticId ? { ...t, id: created.id, user_id: created.user_id } : t))
                            } catch {
                              setTargets((prev) => prev.filter(t => t.id !== optimisticId))
                            } finally {
                              setPickerByGroup((prev) => ({ ...prev, [g.id]: null }))
                            }
                          }
                        }}
                        placeholder="Add a company..."
                        triggerAsChild={<button className="w-full flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 hover:border-border hover:text-foreground transition-colors"><Plus className="h-4 w-4" /> Add company</button>}
                        className="w-[520px]"
                      />
                    </div>
                    <div className="divide-y divide-border">
                      <AnimatePresence initial={false}>
                        {items.length > 0 ? (
                          items.map((t) => (
                            <motion.div
                              key={t.id}
                              initial={{ opacity: 0, y: 10, scale: 0.98, backgroundColor: 'hsl(var(--primary) / 0.10)' }}
                              animate={{ opacity: 1, y: 0, scale: 1, backgroundColor: 'hsl(var(--background) / 0)' }}
                              exit={{ opacity: 0, y: 8, scale: 0.98 }}
                              transition={{ duration: 0.25 }}
                              className="group px-4 py-3 md:px-6 md:py-4 hover:bg-muted/10 flex items-center gap-3"
                              draggable
                              onDragStart={() => setDraggedTargetId(t.id)}
                              onDragEnd={() => { setDraggedTargetId(null); setDragOverGroupId(null) }}
                            >
                              {t.company?.logo_url ? (
                                <img src={t.company.logo_url} className="h-8 w-8 rounded-md border object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-md bg-muted" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{t.company?.name || t.company_id}</div>
                              </div>
                              <button onClick={() => onRemoveTarget(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                              </button>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-6 text-sm text-muted-foreground">No companies in this group yet</motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating create button (FAB) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 z-40"
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <Button size="icon" className="relative h-14 w-14 rounded-full shadow-lg" onClick={onCreateGroup} aria-label="Create group">
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default CompanyGroupsPage


