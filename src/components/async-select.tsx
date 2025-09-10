import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'
import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, X } from 'lucide-react'

export type AsyncSelectVariant = 'popover' | 'dialog'

export interface AsyncSelectProps<T> {
  fetcher: (query?: string) => Promise<Array<T>>
  renderOption: (option: T) => ReactNode
  getOptionValue: (option: T) => string
  value: string
  onChange: (value: string) => void
  onSelect?: (option: T) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  width?: string | number
  className?: string
  triggerClassName?: string
  noResultsMessage?: string
  clearable?: boolean
  variant?: AsyncSelectVariant
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
  selectedLabel?: ReactNode
  minQueryLength?: number
  // Optional: allow custom value creation
  allowCreate?: boolean
  onCreate?: (label: string) => void
}

export function AsyncSelect<T>({
  fetcher,
  renderOption,
  getOptionValue,
  value,
  onChange,
  onSelect,
  label,
  placeholder = 'Search...',
  disabled,
  width,
  className,
  triggerClassName,
  noResultsMessage = 'No results',
  clearable = true,
  variant = 'popover',
  open: openProp,
  onOpenChange,
  triggerAsChild,
  selectedLabel,
  minQueryLength = 2,
  allowCreate = false,
  onCreate,
}: AsyncSelectProps<T>) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 350 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [options, setOptions] = useState<Array<T>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? !!openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  // Fetch on search (debounced)
  useEffect(() => {
    if (!isOpen) return
    const q = debouncedQuery.trim()
    if (q.length < minQueryLength) {
      setOptions([])
      setLoading(false)
      setError('')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const rows = await fetcher(q)
        if (!cancelled) setOptions(rows)
      } catch {
        if (!cancelled) setError('Failed to search')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, debouncedQuery, minQueryLength, fetcher])

  const computedWidth = width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined

  const defaultTrigger = (
    <Button type="button" variant="outline" disabled={disabled} className={`${triggerClassName || ''} w-full` }>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="truncate">{selectedLabel || (value ? 'Selected' : (label || 'Select'))}</span>
        {clearable && value && (
          <button
            type="button"
            className="ml-1 p-0.5 rounded hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </Button>
  )

  const content = (
    <div>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-8 h-9"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              if (allowCreate && e.key === 'Enter' && query.trim().length > 0) {
                // Create custom value
                onCreate?.(query.trim())
                setQuery('')
                setOpen(false)
              }
            }}
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="max-h-72 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-destructive">{error}</div>
        ) : options.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="p-1">
              {options.map((opt, idx) => {
                const id = getOptionValue(opt)
                return (
                  <button
                    key={id || idx}
                    className="w-full text-left rounded-md px-3 py-2 text-sm transition-colors border border-transparent hover:bg-accent/50 hover:text-accent-foreground"
                    onClick={() => {
                      onChange(id)
                      onSelect?.(opt)
                      setQuery('')
                      setOpen(false)
                    }}
                  >
                    {renderOption(opt)}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        ) : query.trim().length < minQueryLength ? (
          <div className="p-3 text-xs text-muted-foreground">Type at least {minQueryLength} characters to search</div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <div>{noResultsMessage}</div>
            {allowCreate && query.trim().length > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onCreate?.(query.trim())
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  Use "{query.trim()}"
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'dialog') {
    const trigger = triggerAsChild || defaultTrigger
    return (
      <div className={className} style={computedWidth ? { width: computedWidth } : undefined}>
        <div onClick={() => setOpen(true)}>{trigger}</div>
        <Dialog open={isOpen} onOpenChange={setOpen}>
          <DialogContent hideClose className="sm:max-w-[560px] p-0 overflow-hidden" style={computedWidth ? { width: computedWidth } : undefined}>
            {content}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerAsChild || defaultTrigger}
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: computedWidth || 'var(--radix-popover-trigger-width)' }}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
        >
          {content}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default AsyncSelect


