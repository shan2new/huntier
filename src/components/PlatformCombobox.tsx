import { cloneElement, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Globe, Loader2, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Platform } from '@/lib/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listPlatforms } from '@/lib/api'

export type PlatformComboboxProps = {
  value: Platform | null
  onChange: (value: Platform | null) => void
  placeholder?: string
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: ReactNode
}

function PlatformItem({ p }: { p: Platform }) {
  return (
    <div className="flex items-center gap-3">
      {p.logo_blob_base64 ? (
        <img
          src={p.logo_blob_base64.startsWith('data:') ? p.logo_blob_base64 : `data:image/png;base64,${p.logo_blob_base64}`}
          alt={p.name}
          className="w-6 h-6 rounded-sm object-cover border border-border"
        />
      ) : (
        <div className="w-6 h-6 rounded-sm bg-muted/40 flex items-center justify-center">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
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

export function PlatformCombobox({ value, onChange, placeholder = 'Select platform...', className, open: openProp, onOpenChange, triggerAsChild }: PlatformComboboxProps) {
  const { getToken } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [rows, setRows] = useState<Array<Platform>>([])

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? !!openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        if (!token) return
        const data = await listPlatforms<Array<Platform>>(token)
        if (!cancelled) setRows(data)
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
  }, [isOpen, getToken])

  // Cmd+K to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || (navigator.platform.includes('Win') && e.ctrlKey)) && e.key.toLowerCase() === 'k'
      if (isCmdK) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const triggerLabel = useMemo(() => {
    if (!value) return placeholder
    return value.name
  }, [value, placeholder])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((p) => p.name.toLowerCase().includes(q))
  }, [rows, query])

  const trigger = triggerAsChild
    ? cloneElement(triggerAsChild as any, {
        onClick: (e: any) => {
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
          ) : (
            <span className="text-xs text-muted-foreground">⌘K</span>
          )}
        </Button>
      )

  return (
    <>
      {trigger}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent hideClose className="sm:max-w-[560px] p-0 overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search platforms..."
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
              {!loading && !error && filtered.length === 0 && query.trim() && (
                <div className="text-xs text-muted-foreground px-1">No results</div>
              )}
              {filtered.map((p) => (
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PlatformCombobox
