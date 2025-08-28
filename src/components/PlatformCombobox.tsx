import { useAuth } from '@clerk/clerk-react'
import { Globe } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Platform } from '@/lib/api'
import { AsyncSelect } from '@/components/async-select'
import { searchPlatformsByName } from '@/lib/api'

export type PlatformComboboxProps = {
  value: Platform | null
  onChange: (value: Platform | null) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
  variant?: 'popover' | 'dialog'
}

function PlatformItem({ p }: { p: Platform }) {
  return (
    <div className="flex items-center gap-3">
      {p.logo_url ? (
        <img
          src={p.logo_url}
          alt={p.name}
          className="w-8 h-8 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{p.name}</div>
        {p.url && (
          <div className="text-xs text-muted-foreground truncate">
            {p.url.replace(/^https?:\/\//i, '')}
          </div>
        )}
      </div>
    </div>
  )
}

export function PlatformCombobox({ value, onChange, placeholder = 'Select platform...', className, open: openProp, onOpenChange, triggerAsChild, variant = 'popover' }: PlatformComboboxProps) {
  const { getToken } = useAuth()

  const renderSelectedLabel = value ? (
    <div className="flex items-center gap-2 min-w-0">
      {value.logo_url ? (
        <img src={value.logo_url} alt={value.name} className="w-4 h-4 rounded-sm object-cover border border-border" />
      ) : (
        <Globe className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="truncate">{value.name}</span>
    </div>
  ) : undefined

  const fetcher = async (q?: string) => {
    const token = await getToken()
    if (!token) return []
    const text = (q || '').trim()
    if (!text) return []
    return await searchPlatformsByName<Array<Platform>>(token, text)
  }

  return (
    <AsyncSelect<Platform>
      fetcher={fetcher}
      renderOption={(p) => <PlatformItem p={p} />}
      getOptionValue={(p) => p.id}
      value={value?.id || ''}
      onChange={(id) => { if (!id) onChange(null) }}
      onSelect={(p) => onChange(p)}
      label="Platform"
      placeholder={placeholder}
      className={className}
      variant={variant}
      open={openProp}
      onOpenChange={onOpenChange}
      triggerAsChild={triggerAsChild}
      selectedLabel={renderSelectedLabel}
      minQueryLength={2}
      clearable
      /* no explicit width so popover matches trigger width */
    />
  )
}

export default PlatformCombobox
