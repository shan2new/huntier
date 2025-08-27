import { cloneElement, useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '@tanstack/react-pacer/debouncer'
import { useAuth } from '@clerk/clerk-react'
import { AlertCircle, Globe, HelpCircle, Loader2, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Platform } from '@/lib/api'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listPlatforms, searchPlatformsByName } from '@/lib/api'

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

function EmptyState({ 
  type, 
  query 
}: { 
  type: 'initial' | 'no-results' | 'error' | 'loading'
  query?: string 
}) {
  switch (type) {
    case 'initial':
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Search by platform name or browse the list
          </p>
        </div>
      )
    
    case 'no-results':
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">No platforms found</h3>
          <p className="text-xs text-muted-foreground max-w-48">
            No platforms match "{query}". Try a different search term or check the spelling.
          </p>
        </div>
      )
    
    case 'error':
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-sm font-medium mb-1">Search failed</h3>
          <p className="text-xs text-muted-foreground max-w-48">
            Unable to search platforms. Please try again in a moment.
          </p>
        </div>
      )
    
    case 'loading':
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium mb-1">Searching...</h3>
          <p className="text-xs text-muted-foreground max-w-48">
            Looking for platforms matching "{query}"
          </p>
        </div>
      )
    
    default:
      return null
  }
}

export function PlatformCombobox({ value, onChange, placeholder = 'Select platform...', className, open: openProp, onOpenChange, triggerAsChild, variant = 'popover' }: PlatformComboboxProps) {
  const { getToken } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, { wait: 500 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [results, setResults] = useState<Array<Platform>>([])
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? !!openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  // Sync input value with selected platform or search query
  useEffect(() => {
    if (value) {
      setInputValue(value.name)
      setQuery('')
    } else {
      setInputValue(query)
    }
  }, [value, query])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const q = debouncedQuery.trim()
      if (q.length < 2) {
        if (!cancelled) {
          // Load initial platforms list when no query
          if (q.length === 0) {
            setLoading(true)
            setError('')
            try {
              const token = await getToken()
              if (!token) return
              const data = await listPlatforms<Array<Platform>>(token)
              if (!cancelled) {
                setResults(data)
              }
            } catch (err) {
              console.error('Platforms load error:', err)
              if (!cancelled) setError('Failed to load platforms')
            } finally {
              if (!cancelled) setLoading(false)
            }
          } else {
            setResults([])
            setOpen(false)
          }
        }
        return
      }
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        if (!token) return
        const data = await searchPlatformsByName<Array<Platform>>(token, q)
        if (!cancelled) {
          setResults(data)
          // Only open dropdown when we have results, close when empty
          if (data.length > 0) {
            setOpen(true)
          } else {
            setOpen(false)
          }
          // Restore focus to input if it was lost during search
          if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus()
          }
        }
      } catch (err) {
        console.error('Platform search error:', err)
        if (!cancelled) setError('Failed to search platforms')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, getToken])

  // Load initial platforms on open
  useEffect(() => {
    if (!isOpen || query.trim().length > 0) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        if (!token) return
        const data = await listPlatforms<Array<Platform>>(token)
        if (!cancelled) {
          setResults(data)
        }
      } catch (err) {
        console.error('Platforms load error:', err)
        if (!cancelled) setError('Failed to load platforms')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isOpen, getToken, query])

  if (variant === 'popover') {
    return (
      <div className="relative">
        <Popover open={isOpen} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setInputValue(newValue)
                  setQuery(newValue)
                  if (value) {
                    onChange(null) // Clear selection when typing
                  }
                  // Don't open dropdown automatically - let the results determine when to open
                }}
                onFocus={() => {
                  if (query.trim().length >= 2 && results.length > 0) {
                    setOpen(true)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results.length > 0) {
                    onChange(results[0])
                    setOpen(false)
                    e.preventDefault()
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  } else if (e.key === 'ArrowDown' && results.length > 0) {
                    setOpen(true)
                    e.preventDefault()
                  }
                }}
                placeholder={placeholder}
                className={`pr-8 ${className || ''}`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {value && !loading && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onChange(null)
                      setInputValue('')
                      setQuery('')
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {!value && !loading && (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="p-2" 
            align="start"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="space-y-2">
              {error && <div className="text-xs text-destructive px-1">{error}</div>}
              <ScrollArea className="max-h-72 pr-2">
                {loading ? (
                  <EmptyState type="loading" query={debouncedQuery} />
                ) : error ? (
                  <EmptyState type="error" />
                ) : results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map((p) => (
                      <button
                        key={p.id}
                        className="w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/40 p-2"
                        onClick={() => {
                          onChange(p)
                          setOpen(false)
                        }}
                      >
                        <PlatformItem p={p} />
                      </button>
                    ))}
                  </div>
                ) : debouncedQuery.trim().length >= 2 ? (
                  <EmptyState type="no-results" query={debouncedQuery} />
                ) : (
                  <EmptyState type="initial" />
                )}
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      </div>
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
            {value?.logo_url ? (
              <img
                src={value.logo_url}
                alt={value.name}
                className="w-4 h-4 rounded-sm object-cover border border-border"
              />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>{value ? value.name : placeholder}</span>
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
                placeholder="Type a platform name..."
                className="bg-input/70 pr-8"
              />
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>
          {error && <div className="text-xs text-destructive px-4 py-2">{error}</div>}
          <ScrollArea className="max-h-[60vh] p-3">
            {loading ? (
              <EmptyState type="loading" query={debouncedQuery} />
            ) : error ? (
              <EmptyState type="error" />
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left rounded-md border border-transparent hover:border-border hover:bg-muted/40 p-2"
                    onClick={() => {
                      onChange(p)
                      setOpen(false)
                    }}
                  >
                    <PlatformItem p={p} />
                  </button>
                ))}
              </div>
            ) : debouncedQuery.trim().length >= 2 ? (
              <EmptyState type="no-results" query={debouncedQuery} />
            ) : (
              <EmptyState type="initial" />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PlatformCombobox
