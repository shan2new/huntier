import React, { useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router'
import { UserButton } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Search, BarChart3, Kanban, Globe, Users, User, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navItems = [
    { to: '/applications', label: 'Applications', icon: BarChart3 },
    { to: '/board', label: 'Board', icon: Kanban },
    { to: '/platforms', label: 'Platforms', icon: Globe },
    { to: '/referrers', label: 'Referrers', icon: Users },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen">
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
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex h-8 w-8 items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="layoutIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#1D4ED8', stopOpacity:1}} />
                      </linearGradient>
                      <linearGradient id="layoutTierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#60A5FA', stopOpacity:0.8}} />
                        <stop offset="100%" style={{stopColor:'#3B82F6', stopOpacity:0.6}} />
                      </linearGradient>
                    </defs>
                    
                    {/* Background circle for better icon definition */}
                    <circle cx="24" cy="24" r="22" fill="url(#layoutIconGradient)" opacity="0.1"/>
                    
                    {/* H symbol with tier elements for icon */}
                    <g fill="url(#layoutIconGradient)">
                      {/* Main H structure */}
                      <rect x="12" y="12" width="4" height="24" rx="2"/>
                      <rect x="32" y="12" width="4" height="24" rx="2"/>
                      <rect x="12" y="22" width="24" height="4" rx="2"/>
                      
                      {/* Tier steps ascending - simplified for icon */}
                      <rect x="38" y="32" width="6" height="2" rx="1" fill="url(#layoutTierGradient)"/>
                      <rect x="40" y="28" width="6" height="2" rx="1" fill="url(#layoutTierGradient)"/>
                      <rect x="42" y="24" width="4" height="2" rx="1" fill="url(#layoutIconGradient)"/>
                    </g>
                  </svg>
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors leading-none">
                    Huntier
                  </span>
                  <span className="text-xs text-muted-foreground leading-none">
                    Modern Tier Job hunting
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
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    placeholder="Search applications..."
                    className="pl-8 pr-10 w-64 h-8 text-sm bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        navigate({ to: '/applications', search: { search: e.currentTarget.value } })
                      }
                    }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <Command className="h-2.5 w-2.5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4 text-[10px]">
                      /
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


