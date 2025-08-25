import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
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
  const searchRef = useRef<HTMLInputElement>(null)
  const [, setTheme] = useState<'light' | 'dark'>('light')
  const { getToken } = useAuthToken()
  const [, setProfile] = useState<UserProfile | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/' })
    }
  }, [isSignedIn, isLoaded, navigate])

  // Do not place hooks after conditional returns; attach global hotkey listener unconditionally
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        // Focus global search input
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  ref={searchRef}
                  placeholder="Search..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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

