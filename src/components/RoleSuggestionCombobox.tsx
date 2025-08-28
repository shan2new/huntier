import { useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import type { RoleSearchItem, RoleSuggestion } from '@/lib/api'
import { searchRolesWithRefresh } from '@/lib/api'
import { AsyncSelect } from '@/components/async-select'

export type RoleSuggestionComboboxProps = {
  companyId: string
  onChoose: (s: RoleSuggestion) => void
  currentRole?: string | null
  currentCompany?: string | null
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
  showAsInput?: boolean
  inputValue?: string
  onInputValueChange?: (value: string) => void
  placeholder?: string
}

export function RoleSuggestionCombobox({
  companyId: _companyId,
  onChoose,
  currentRole: _currentRole,
  currentCompany: _currentCompany,
  className,
  open: openProp,
  onOpenChange,
  triggerAsChild,
  inputValue = '',
  onInputValueChange,
  placeholder = 'Search roles...',
}: RoleSuggestionComboboxProps) {
  const { getToken } = useAuth()

  const fetcher = async (q?: string) => {
    const tokenFn = async () => (await getToken()) || ''
    const list = await searchRolesWithRefresh(tokenFn, (q || '').trim(), 20)
    return list
  }

  return (
    <AsyncSelect<RoleSearchItem>
      fetcher={fetcher}
      renderOption={(r) => (
        <div className="px-1 py-0.5 text-sm truncate">{r.title}</div>
      )}
      getOptionValue={(r) => r.id || r.title}
      value={(inputValue || '').trim()}
      onChange={(id) => {
        // Only used for clear action
        if (!id && onInputValueChange) onInputValueChange('')
      }}
      onSelect={(r) => onChoose({ role: r.title })}
      label="Role"
      placeholder={placeholder}
      className={className || 'w-full'}
      triggerClassName="h-10 justify-start text-left"
      variant="popover"
      open={openProp}
      onOpenChange={onOpenChange}
      triggerAsChild={triggerAsChild}
      selectedLabel={(inputValue || '').trim() ? (
        <span className="truncate text-sm font-normal">{inputValue}</span>
      ) : undefined}
      minQueryLength={2}
      clearable
      /* Let popover match trigger width */
      allowCreate
      onCreate={(label) => onChoose({ role: label, reason: 'Custom role' })}
    />
  )
}

export default RoleSuggestionCombobox
