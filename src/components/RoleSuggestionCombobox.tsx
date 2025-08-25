import { cloneElement, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Loader2, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RoleSuggestion } from '@/lib/api'
import { getRoleSuggestions } from '@/lib/api'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
  companyId,
  onChoose,
  currentRole,
  currentCompany,
  className,
  open: openProp,
  onOpenChange,
  triggerAsChild,
  showAsInput = false,
  inputValue = '',
  onInputValueChange,
  placeholder = 'Search roles...',
}: RoleSuggestionComboboxProps) {
  const { getToken } = useAuth()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [rows, setRows] = useState<Array<RoleSuggestion>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? !!openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v)
    else setInternalOpen(v)
  }

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedIndex(-1)
      return
    }
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const token = await getToken()
        if (!token) return
        const data = await getRoleSuggestions(token, companyId, {
          current_role: currentRole ?? undefined,
          current_company: currentCompany ?? undefined,
        })
        const list = Array.isArray(data.suggestions) ? data.suggestions : []
        if (!cancelled) setRows(list)
      } catch (err) {
        console.error('Role suggestions load error:', err)
        if (!cancelled) setError('Failed to load suggestions')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [isOpen, getToken, companyId, currentRole, currentCompany])

  // Filter suggestions based on search query
  const filteredRows = rows.filter(role => 
    role.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredRows.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredRows.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredRows[selectedIndex]) {
          onChoose(filteredRows[selectedIndex])
          setOpen(false)
        } else if (searchQuery.trim()) {
          // If no suggestion is selected but user entered text, use it as custom role
          onChoose({ role: searchQuery, reason: 'Custom role' })
          setOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchQuery])

  const trigger = triggerAsChild
    ? cloneElement(triggerAsChild as any, {
        onClick: (e: any) => {
          try {
            (triggerAsChild as any).props?.onClick?.(e)
          } catch {}
          setOpen(true)
        },
      })
    : showAsInput
    ? (
        <div className={`relative w-full ${className || ''}`}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputValueChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pr-8"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
        </div>
      )
    : (
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-3 ${className || ''}`}
          onClick={() => setOpen(true)}
        >
          <Search className="h-3.5 w-3.5 mr-1" />
          Search
        </Button>
      )

  const empty = !loading && !error && filteredRows.length === 0
  const noResults = !loading && !error && rows.length > 0 && filteredRows.length === 0

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 border-border bg-card" 
        align="start" 
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
      >
        <div className="border-b border-border p-3 bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search roles..."
              className="pl-9 pr-8 h-8 text-sm w-full"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-60 min-h-[60px] overflow-hidden bg-card">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Finding role suggestions...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-center mb-2">
                <div className="text-sm text-destructive">Failed to load suggestions</div>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onChoose({ role: searchQuery, reason: 'Custom role' })
                    setOpen(false)
                  }}
                >
                  Use "{searchQuery}"
                </Button>
              )}
            </div>
          )}
          
          {empty && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-center mb-2">
                <div className="text-sm font-medium">No suggestions available</div>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    onChoose({ role: searchQuery, reason: 'Custom role' })
                    setOpen(false)
                  }}
                >
                  Use "{searchQuery}"
                </Button>
              )}
            </div>
          )}
          
          {noResults && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-center mb-2">
                <div className="text-sm font-medium">No matching roles</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  onChoose({ role: searchQuery, reason: 'Custom role' })
                  setOpen(false)
                }}
              >
                Use "{searchQuery}"
              </Button>
            </div>
          )}
          
          {!empty && !loading && !error && !noResults && (
            <ScrollArea className="h-full">
              <div className="p-1">
                {filteredRows.map((s, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors border border-transparent ${
                      selectedIndex === idx
                        ? 'bg-accent text-accent-foreground border-border'
                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                    }`}
                    onClick={() => {
                      onChoose(s)
                      setOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-sm leading-tight">{s.role}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          AI
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
      </PopoverContent>
    </Popover>
  )
}

export default RoleSuggestionCombobox
