import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import type { UserProfile } from '@/lib/api'
import { useAuthToken } from '@/lib/auth'
import { getProfileWithRefresh } from '@/lib/api'
import { SplashLoader } from '@/components/SplashLoader'
import { ProfileCompletionDialog } from '@/components/ProfileCompletionDialog'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarRail } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import MobileTopBar from '@/components/mobile/MobileTopBar'
import BottomNav from '@/components/mobile/BottomNav'


export function Layout() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [, setTheme] = useState<'light' | 'dark'>('light')
  const { getToken } = useAuthToken()
  const [, setProfile] = useState<UserProfile | null>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const isMobile = useIsMobile()
  const excludeMobileShell = location.pathname.startsWith('/resumes/')

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/' })
    }
  }, [isSignedIn, isLoaded, navigate])

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
        <SidebarInset className="h-full w-full">
          <div className="flex flex-col h-full w-full">
            {isMobile && !excludeMobileShell ? <MobileTopBar /> : null}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`h-full w-full ${isMobile && !excludeMobileShell ? 'pt-4 pb-16 px-3' : 'py-6'}`}
            >
              <Outlet />
            </motion.div>
            {isMobile && !excludeMobileShell ? <BottomNav /> : null}
          </div>
        </SidebarInset>
    </SidebarProvider>
  )
}

