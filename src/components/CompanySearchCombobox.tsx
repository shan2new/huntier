import { cloneElement, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'
import { useAuth } from '@clerk/clerk-react'
import { Building2, Calendar, Globe, Loader2, MapPin, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Company } from '@/lib/api'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { searchCompaniesByName } from '@/lib/api'

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

function extractHostname(url?: string) {
  if (!url) return ''
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }
}

function CompanyItem({ c }: { c: Company }) {
  const hq = c.hq ? [c.hq.city, c.hq.country].filter(Boolean).join(', ') : null
  const industry = c.industries?.[0]
  return (
    <div className="flex items-center gap-3">
      {c.logo_blob_base64 ? (
        <img
          src={c.logo_blob_base64.startsWith('data:') ? c.logo_blob_base64 : `data:image/png;base64,${c.logo_blob_base64}`}
          alt={c.name}
          className="w-8 h-8 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted/40 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-muted-foreground" />
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
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {hq}</span>
          )}
          {industry && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">{industry}</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

export function CompanySearchCombobox({ value, onChange, placeholder = 'Search companies...', className, open: openProp, onOpenChange, triggerAsChild, variant = 'popover' }: CompanySearchComboboxProps) {
  const { getToken } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 500 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [results, setResults] = useState<Array<Company>>([])

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? !!openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      const q = debouncedQuery.trim()
      if (q.length < 2) {
        if (!cancelled) setResults([])
        return
      }
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        const rows = await searchCompaniesByName<Array<Company>>(token!, q)
        if (!cancelled) setResults(rows)
      } catch (err) {
        console.error('Company search error:', err)
        if (!cancelled) setError('Failed to search companies')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, getToken])

  const triggerLabel = useMemo(() => {
    if (!value) return placeholder
    return value.name
  }, [value, placeholder])

  if (variant === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerAsChild ? (
            triggerAsChild
          ) : (
            <Button
              variant="outline"
              className={`w-full justify-between h-10 ${className || ''}`}
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {value?.logo_blob_base64 ? (
                  <img
                    src={value.logo_blob_base64.startsWith('data:') ? value.logo_blob_base64 : `data:image/png;base64,${value.logo_blob_base64}`}
                    alt={value.name}
                    className="w-4 h-4 rounded-sm object-cover border border-border"
                  />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>{triggerLabel}</span>
              </div>
              {value && (
                <X
                  className="h-4 w-4 text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange(null)
                  }}
                />
              )}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[480px] p-2" align="start">
          <div className="space-y-2">
            <div className="relative">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results.length > 0) {
                    onChange(results[0])
                    setOpen(false)
                    e.preventDefault()
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                placeholder="Type a company name..."
                className="bg-background/50 pr-8"
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
            {error && <div className="text-xs text-destructive px-1">{error}</div>}
            {!loading && !error && results.length === 0 && debouncedQuery.trim().length >= 2 && (
              <div className="text-xs text-muted-foreground px-1">No results</div>
            )}
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-1">
                {results.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/40 p-2"
                    onClick={() => {
                      onChange(c)
                      setOpen(false)
                    }}
                  >
                    <CompanyItem c={c} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Dialog (command palette) variant
  const trigger = triggerAsChild
    ? cloneElement(triggerAsChild as any, {
        onClick: (e: any) => {
          // preserve original onClick if any
          try {
            (triggerAsChild as any).props?.onClick?.(e)
          } catch {}
          setOpen(true)
        },
      })
    : (
        <Button
          variant="outline"
          className={`w-full justify-between h-10 ${className || ''}`}
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {value?.logo_blob_base64 ? (
              <img
                src={value.logo_blob_base64.startsWith('data:') ? value.logo_blob_base64 : `data:image/png;base64,${value.logo_blob_base64}`}
                alt={value.name}
                className="w-4 h-4 rounded-sm object-cover border border-border"
              />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>{triggerLabel}</span>
          </div>
          {value ? (
            <X
              className="h-4 w-4 text-muted-foreground"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange(null)
              }}
            />
          ) : null}
        </Button>
      )

  return (
    <>
      {trigger}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent hideClose className="sm:max-w-[640px] p-0 overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results.length > 0) {
                    onChange(results[0])
                    setOpen(false)
                    e.preventDefault()
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                placeholder="Type a company name..."
                className="bg-background/50 pr-8"
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>
          {error && <div className="text-xs text-destructive px-4 py-2">{error}</div>}
          <ScrollArea className="max-h-[60vh] p-3">
            <div className="space-y-1">
              {!loading && !error && results.length === 0 && debouncedQuery.trim().length >= 2 && (
                <div className="text-xs text-muted-foreground px-1">No results</div>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/40 p-2"
                  onClick={() => {
                    onChange(c)
                    setOpen(false)
                  }}
                >
                  <CompanyItem c={c} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CompanySearchCombobox
