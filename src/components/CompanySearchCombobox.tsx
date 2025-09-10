import { useAuth } from '@clerk/clerk-react'
import { Building2, Calendar, Globe, HelpCircle, Search } from 'lucide-react'
import { AsyncSelect } from './async-select'
import type { ReactNode } from 'react'
import type { Company } from '@/lib/api'
import { searchCompaniesByNameWithRefresh, searchCompaniesWithRefresh } from '@/lib/api'
import { extractHostname } from '@/lib/utils'

export type CompanySearchComboboxProps = {
  value: Company | null
  onChange: (value: Company | null) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
  variant?: 'popover' | 'dialog'
}

function CompanyItem({ c }: { c: Company }) {
  const hq = c.hq ? [c.hq.city, c.hq.country].filter(Boolean).join(', ') : null
  const industry = c.industries?.[0]
  return (
    <div className="flex items-center gap-3">
      {c.logo_url ? (
        <img
          src={c.logo_url}
          alt={c.name}
          className="w-8 h-8 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center">
          <Building2 className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{c.name}</div>
        <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
          {c.website_url && (
            <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {extractHostname(c.website_url)}</span>
          )}
          {c.founded_year && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.founded_year}</span>
          )}
          {hq && (
            <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {hq}</span>
          )}
          {industry && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{industry}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function CompanySearchCombobox({ value, onChange, placeholder = 'Search companies...', className, open: openProp, onOpenChange, triggerAsChild, variant = 'popover' }: CompanySearchComboboxProps) {
  const { getToken } = useAuth()

  const renderSelectedLabel = value ? (
    <div className="flex items-center gap-2 min-w-0">
      {value.logo_url ? (
        <img src={value.logo_url} alt={value.name} className="w-4 h-4 rounded-sm object-cover border border-border" />
      ) : (
        <Search className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="truncate">{value.name}</span>
    </div>
  ) : undefined

  const fetcher = async (q?: string) => {
    const text = (q || '').trim()
    if (!text) return []
    const tokenFn = async () => (await getToken()) || ''
    const rows = await searchCompaniesWithRefresh<Array<Company>>(tokenFn, text)
    if (rows.length > 0) return rows
    try {
      return await searchCompaniesByNameWithRefresh<Array<Company>>(tokenFn, text)
    } catch {
      return []
    }
  }

  return (
    <AsyncSelect<Company>
      fetcher={fetcher}
      renderOption={(c: Company) => <CompanyItem c={c} />}
      getOptionValue={(c: Company) => c.id}
      value={value?.id || ''}
      onChange={(id: string) => { if (!id) onChange(null) }}
      onSelect={(c: Company) => onChange(c)}
      label="Company"
      placeholder={placeholder}
      className={`${variant === 'dialog' ? '' : 'max-w-[600px] w-full'} ${className || ''}`}
      variant={variant}
      open={openProp}
      onOpenChange={onOpenChange}
      triggerAsChild={triggerAsChild}
      selectedLabel={renderSelectedLabel}
      minQueryLength={2}
      clearable
      width={variant === 'dialog' ? undefined : 600}
    />
  )
}

export default CompanySearchCombobox
