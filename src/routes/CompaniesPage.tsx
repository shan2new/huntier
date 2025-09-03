import { useEffect, useMemo, useState } from 'react'
import { useAuthToken } from '@/lib/auth'
import { motion } from 'motion/react'
import { BadgeCheck, Building2, Globe, Search } from 'lucide-react'
import type { ApplicationListItem, Company } from '@/lib/api'
import { listMyCompaniesAllWithRefresh } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { extractHostname } from '@/lib/utils'

export function CompaniesPage() {
  const { getToken } = useAuthToken()
  const { apiCall } = useApi()
  const [companies, setCompanies] = useState<Array<Company>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [apps, setApps] = useState<Array<ApplicationListItem>>([])

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      try {
        const rows = await listMyCompaniesAllWithRefresh(getToken, search || undefined)
        if (!ignore) setCompanies(rows)
        const data = await apiCall<Array<ApplicationListItem>>('/v1/applications')
        if (!ignore) setApps(data)
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [getToken, search])

  const visible = useMemo(() => {
    if (!search) return companies
    const q = search.toLowerCase()
    return companies.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.website_url || '').toLowerCase().includes(q) ||
      (c.domain || '').toLowerCase().includes(q)
    )
  }, [companies, search])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full">
      <div className="px-6 pb-2 flex justify-center w-full">
        <div className="relative max-w-4xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="pl-9" />
        </div>
      </div>
      <ScrollArea className="flex-1 mt-8">
        <div className="px-6 pb-6 mx-auto w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-[112px] animate-pulse" />
            ))
          ) : (
            visible.map((c) => (
              <Card key={c.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="w-12 h-12 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted/40 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {c.website_url && <><Globe className="h-3 w-3" /> {extractHostname(c.website_url)}</>}
                      {apps.some(a => a.company_id === c.id) && (
                        <span className="ml-2 inline-flex items-center gap-1 text-green-500">
                          <BadgeCheck className="h-3 w-3" /> In applications
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </motion.div>
  )
}

export default CompaniesPage


