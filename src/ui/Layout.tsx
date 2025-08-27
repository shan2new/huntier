import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import { Command, Search, X } from 'lucide-react'
import type { UserProfile } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'
import { getProfileWithRefresh } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { SplashLoader } from '@/components/SplashLoader'
import { ProfileCompletionDialog } from '@/components/ProfileCompletionDialog'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function Layout() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [, setTheme] = useState<'light' | 'dark'>('light')
  const { getToken } = useAuthToken()
  const [, setProfile] = useState<UserProfile | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/' })
    }
  }, [isSignedIn, isLoaded, navigate])

  // Initialize search value from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const searchQuery = searchParams.get('search') || ''
    setSearchValue(searchQuery)
  }, [location.search])

  // Global hotkey listener for search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (location.pathname === '/applications') {
      const params = new URLSearchParams(location.search)
      if (value.trim()) {
        params.set('search', value.trim())
      } else {
        params.delete('search')
      }
      const newSearch = params.toString()
      navigate({ 
        to: '/applications',
        search: newSearch ? `?${newSearch}` : undefined,
        replace: true
      })
    } else if (value.trim()) {
      navigate({ 
        to: '/applications',
        search: `?search=${encodeURIComponent(value.trim())}`
      })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchValue)
    searchRef.current?.blur()
  }

  const clearSearch = () => {
    setSearchValue('')
    handleSearch('')
    searchRef.current?.focus()
  }

  // Load profile (theme + completeness)
  useEffect(() => {
    ;(async () => {
      try {
        if (!isLoaded || !isSignedIn) return
        const tokenGetter = async () => (await getToken()) || ''
        const p = await getProfileWithRefresh<UserProfile>(tokenGetter)
        setProfile(p)
        const t = (p.theme as 'light' | 'dark' | undefined) || 'light'
        setTheme(t)
        document.documentElement.classList.toggle('dark', t === 'dark')
        // decide if dialog should show
        const incomplete = isProfileIncomplete(p)
        setShowProfileDialog(incomplete)
      } catch {
        // ignore profile load errors for layout
      } finally {}
    })()
  }, [isLoaded, isSignedIn, getToken])

  const isProfileIncomplete = useMemo(() => {
    return (p: UserProfile | null) => {
      if (!p) return true
      if (!p.persona) return true
      if (p.persona === 'professional') {
        const hasRole = !!(p.current_role && p.current_role.trim())
        const hasCompany = !!p.current_company_id
        return !(hasRole && hasCompany)
      }
      // student/intern
      const info = (p.persona_info || {}) as any
      const hasDegree = !!(info.degree && String(info.degree).trim())
      const hasInstitution = !!(info.institution && String(info.institution).trim())
      const hasGradYear = !!(info.graduation_year && String(info.graduation_year).trim())
      const hasMajor = !!(info.major && String(info.major).trim())
      return !(hasDegree && hasInstitution && hasGradYear && hasMajor)
    }
  }, [])

  // theme toggling is now handled on Profile page

  if (!isLoaded) {
    return <SplashLoader />
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <SidebarProvider className="bg-accent/20">
        {/* Blocking profile completion dialog */}
        <ProfileCompletionDialog
          open={showProfileDialog}
          onOpenChange={(v) => setShowProfileDialog(v)}
          allowSkip={false}
          onCompleted={(p) => {
            setProfile(p)
            setShowProfileDialog(false)
          }}
        />
        {/* Shell: sidebar + content */}
        <AppSidebar />
        <SidebarRail />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center">
            {/* Left rail: sidebar trigger */}
            <div className="w-16 flex items-center px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="ml-2 data-[orientation=vertical]:h-4" />
            </div>

            {/* Center: search (fixed width, centered) */}
            <div className="flex-1 flex justify-center px-2">
              <motion.div 
                className="relative w-full max-w-sm"
                initial={false}
                animate={{
                  scale: isSearchFocused ? 1.02 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary/80 transition-colors duration-200" />
                    <Input
                      ref={searchRef}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Search applications..."
                      className="pl-8 pr-16 h-9 text-sm bg-background/60 backdrop-blur-sm border-border/60 focus:border-primary/40 focus:bg-background/80 transition-all duration-200 focus:shadow-sm focus:ring-1 focus:ring-primary/20"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <AnimatePresence>
                        {searchValue && (
                          <motion.button
                            type="button"
                            onClick={clearSearch}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="p-1 rounded-sm hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                      <div className="flex items-center text-xs text-muted-foreground/60 bg-muted/40 rounded px-1.5 py-0.5 border">
                        <Command className="h-2.5 w-2.5 mr-0.5" />
                        <span>K</span>
                      </div>
                    </div>
                  </div>
                </form>
                
                {/* Search suggestions/status */}
                <AnimatePresence>
                  {isSearchFocused && searchValue && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-popover/95 backdrop-blur-sm border border-border/60 rounded-md shadow-md z-50"
                    >
                      <div className="p-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Search className="h-3 w-3" />
                          <span>Press Enter to search for "{searchValue}"</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </header>
          <div className="flex flex-1 flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </SidebarInset>
    </SidebarProvider>
  )
}

