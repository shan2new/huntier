import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FolderTree, GripVertical, Plus, X } from 'lucide-react'
import type { Company, CompanyGroup, UserCompanyTarget } from '@/lib/api'
import { addMyCompanyTargetWithRefresh, deleteMyCompanyTargetWithRefresh, listMyCompanyGroupsWithRefresh, listMyCompanyTargetsWithRefresh, reorderGroupTargetsWithRefresh } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { CompanySearchCombobox } from '@/components/CompanySearchCombobox'

export function CompanyGroupDetailPage({ groupId }: { groupId: string }) {
  const { getToken } = useAuthToken()
  const [groups, setGroups] = useState<Array<CompanyGroup>>([])
  const [targets, setTargets] = useState<Array<UserCompanyTarget & { company?: Company | null }>>([])
  const [loading, setLoading] = useState(true)
  const [picker, setPicker] = useState<Company | null>(null)

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

  useEffect(() => { refresh() }, [])

  const group = useMemo(() => groups.find(g => g.id === groupId) || null, [groups, groupId])
  const items = useMemo(() => targets.filter(t => t.group_id === groupId).sort((a, b) => (a as any).sort_order - (b as any).sort_order), [targets, groupId])
  const [dragId, setDragId] = useState<string | null>(null)

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full h-full px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <FolderTree className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-base font-semibold">{group?.name || 'Group'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <CompanySearchCombobox
              value={picker}
              onChange={async (c) => {
                setPicker(c)
                if (c) {
                  const optimisticId = `temp-${Date.now()}-${c.id}`
                  const optimistic = { id: optimisticId, user_id: 'optimistic', company_id: c.id, group_id: groupId, company: c, _key: optimisticId } as any
                  setTargets((prev) => [...prev, optimistic])
                  try {
                    const created = await addMyCompanyTargetWithRefresh(getToken, { company_id: c.id, group_id: groupId }) as any
                    setTargets((prev) => prev.map(t => (t as any)._key === optimisticId ? { ...t, id: created.id, user_id: created.user_id } as any : t))
                  } catch {
                    setTargets((prev) => prev.filter(t => t.id !== optimisticId))
                  } finally {
                    setPicker(null)
                  }
                }
              }}
              placeholder="Add company..."
              triggerAsChild={<button className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border hover:bg-muted"><Plus className="h-3 w-3" /> Add</button>}
              className="w-[520px]"
            />
            <span className="inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border">{items.length}</span>
          </div>
        </div>

        <Card className="shadow-xs">
          <CardContent className="p-0">

            <div className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-6 animate-pulse" />
                ))
              ) : (
                <AnimatePresence initial={false}>
                  {items.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-6 text-sm text-muted-foreground">No companies in this group yet</motion.div>
                  ) : (
                    items.map((t, idx) => (
                      <motion.div
                        key={(t as any)._key || t.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98, backgroundColor: 'hsl(var(--primary) / 0.10)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, backgroundColor: 'hsl(var(--background) / 0)' }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        className="group px-4 py-3 md:px-6 md:py-4 flex items-center gap-3"
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (!dragId || dragId === t.id) return
                          const a = items.findIndex(i => i.id === dragId)
                          const b = idx
                          if (a === -1) return
                          const newOrder = items.map(i => i.id)
                          const [moved] = newOrder.splice(a, 1)
                          newOrder.splice(b, 0, moved)
                          // optimistic reorder locally by updating sort_order
                          setTargets(prev => prev.map(x => {
                            const pos = newOrder.indexOf(x.id)
                            return pos >= 0 ? { ...(x as any), sort_order: pos } : x
                          }))
                        }}
                        onDragEnd={async () => {
                          if (!dragId) return
                          const orderedIds = items.sort((a, b) => (a as any).sort_order - (b as any).sort_order).map(i => i.id)
                          try {
                            await reorderGroupTargetsWithRefresh(getToken, groupId, orderedIds)
                          } finally {
                            setDragId(null)
                          }
                        }}
                      >
                        <button
                          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={() => setDragId(t.id)}
                          onDragEnd={async () => {
                            if (!dragId) return
                            const orderedIds = items.sort((a, b) => (a as any).sort_order - (b as any).sort_order).map(i => i.id)
                            try {
                              await reorderGroupTargetsWithRefresh(getToken, groupId, orderedIds)
                            } finally {
                              setDragId(null)
                            }
                          }}
                          aria-label="Drag to reorder"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
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
                  )}
                </AnimatePresence>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export default CompanyGroupDetailPage


