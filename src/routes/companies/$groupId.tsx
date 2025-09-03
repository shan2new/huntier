import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FolderTree, Plus } from 'lucide-react'
import type { Company, CompanyGroup, UserCompanyTarget } from '@/lib/api'
import { addMyCompanyTargetWithRefresh, listMyCompanyGroupsWithRefresh, listMyCompanyTargetsWithRefresh } from '@/lib/api'
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
  const items = useMemo(() => targets.filter(t => t.group_id === groupId), [targets, groupId])

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
          <span className="inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border">{items.length}</span>
        </div>

        <Card className="shadow-xs">
          <CardContent className="p-0">
            {/* Add company row */}
            <div className="px-4 py-3 md:px-6 md:py-4">
              <CompanySearchCombobox
                value={picker}
                onChange={async (c) => {
                  setPicker(c)
                  if (c) {
                    const optimisticId = `temp-${Date.now()}-${c.id}`
                    const optimistic = { id: optimisticId, user_id: 'optimistic', company_id: c.id, group_id: groupId, company: c } as any
                    setTargets((prev) => [...prev, optimistic])
                    try {
                      const created = await addMyCompanyTargetWithRefresh(getToken, { company_id: c.id, group_id: groupId }) as any
                      setTargets((prev) => prev.map(t => t.id === optimisticId ? { ...t, id: created.id, user_id: created.user_id } : t))
                    } catch {
                      setTargets((prev) => prev.filter(t => t.id !== optimisticId))
                    } finally {
                      setPicker(null)
                    }
                  }
                }}
                placeholder="Add a company..."
                triggerAsChild={<button className="w-full flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 hover:border-border hover:text-foreground transition-colors"><Plus className="h-4 w-4" /> Add company</button>}
                className="w-[520px]"
              />
            </div>

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
                    items.map((t) => (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3">
                        {t.company?.logo_url ? (
                          <img src={t.company.logo_url} className="h-8 w-8 rounded-md border object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{t.company?.name || t.company_id}</div>
                        </div>
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


