import { Mail, Send, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { AsyncSelect } from '@/components/async-select'

type SourceOption = {
  value: string
  label: string
  icon: (props: { className?: string }) => ReactNode
}

export type SourceComboboxProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
  variant?: 'popover' | 'dialog'
}

const SOURCE_OPTIONS: Array<SourceOption> = [
  { value: 'applied_self', label: 'Direct', icon: (p) => <Send className={p.className || 'h-4 w-4'} /> },
  { value: 'applied_referral', label: 'Referral', icon: (p) => <UserPlus className={p.className || 'h-4 w-4'} /> },
  { value: 'recruiter_outreach', label: 'Recruiter', icon: (p) => <Mail className={p.className || 'h-4 w-4'} /> },
]

function SourceItem({ opt }: { opt: SourceOption }) {
  const Icon = opt.icon as any
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 opacity-80" />
      <span className="text-sm">{opt.label}</span>
    </div>
  )
}

export function SourceCombobox({ value, onChange, placeholder = 'Select source...', className, open: openProp, onOpenChange, triggerAsChild, variant = 'popover' }: SourceComboboxProps) {
  const selected = SOURCE_OPTIONS.find((o) => o.value === value) || null

  const renderSelectedLabel = selected ? (
    <div className="flex items-center gap-2 min-w-0">
      {(selected.icon as any)({ className: 'h-4 w-4 opacity-80' })}
      <span className="truncate">{selected.label}</span>
    </div>
  ) : undefined

  const fetcher = async (q?: string) => {
    const text = (q || '').trim().toLowerCase()
    if (!text) return SOURCE_OPTIONS
    return SOURCE_OPTIONS.filter((o) =>
      o.label.toLowerCase().includes(text)
      || o.value.toLowerCase().includes(text)
    )
  }

  return (
    <AsyncSelect<SourceOption>
      fetcher={fetcher}
      renderOption={(o) => <SourceItem opt={o} />}
      getOptionValue={(o) => o.value}
      value={value || ''}
      onChange={(v) => onChange(v)}
      label="Source"
      placeholder={placeholder}
      className={className}
      variant={variant}
      open={openProp}
      onOpenChange={onOpenChange}
      triggerAsChild={triggerAsChild}
      selectedLabel={renderSelectedLabel}
      minQueryLength={0}
      clearable
    />
  )
}

export default SourceCombobox


