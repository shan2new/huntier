import React, { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { UserButton, useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { BarChart3, ClipboardCheck, ClipboardList, Kanban, Search, User } from 'lucide-react'
import type { UserProfile } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getProfile } from '@/lib/api'
import logo512 from '/logo512.svg'

export function Layout() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  const [, setTheme] = useState<'light' | 'dark'>('light')

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
        // Show coming soon message since search is disabled
        alert('Global search coming soon!')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Load theme from profile
  useEffect(() => {
    ;(async () => {
      try {
        if (!isLoaded || !isSignedIn) return
        const token = await (useAuth() as any).getToken?.()
        if (!token) return
        const profile = await getProfile<UserProfile>(token)
        const t = (profile.theme as 'light' | 'dark' | undefined) || 'light'
        setTheme(t)
        document.documentElement.classList.toggle('dark', t === 'dark')
      } catch {}
    })()
  }, [isLoaded, isSignedIn])

  // theme toggling is now handled on Profile page

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const navItems = [
    { to: '/applications', label: 'Applications', icon: ClipboardList },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-accent/20">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 glass border-b"
      >
        <div className="container mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2.5"
            >
              <Link to="/applications" className="flex items-center space-x-2.5 group">
                <motion.img
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  src={logo512}
                  alt="Huntier logo"
                  className="h-8 w-8"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-heading-24 tracking-tight group-hover:text-primary transition-colors leading-none">
                    Huntier
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item, index) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  current={location.pathname.startsWith(item.to)}
                  index={index}
                >
                  {item.label}
                </NavItem>
              ))}
            </nav>

            {/* Search & User */}
            <div className="flex items-center space-x-3">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative hidden md:block"
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    ref={searchRef}
                    placeholder="Search..."
                    disabled
                    className="pl-8 pr-24 w-64 h-8 text-sm bg-background/30 border-zinc-200/30 dark:border-zinc-800/30 cursor-not-allowed opacity-60"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5 text-[10px] bg-muted/50 text-muted-foreground border-0">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7 ring-1 ring-primary/20 hover:ring-primary/40 transition-all"
                    }
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="container mx-auto max-w-7xl px-4 py-6"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}

function NavItem({ 
  to, 
  current, 
  children, 
  icon: Icon,
  index 
}: { 
  to: string
  current: boolean
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={to}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-lg",
            current
              ? "text-primary bg-primary/10 shadow-soft"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{children}</span>
          {current && (
            <motion.div
              layoutId="active-nav"
              className="absolute inset-0 rounded-lg bg-primary/5 border border-primary/20"
              transition={{ duration: 0.2 }}
              style={{ zIndex: -1 }}
            />
          )}
        </motion.div>
      </Link>
    </motion.div>
  )
}


