import { Link, useLocation } from "@tanstack/react-router"
import { ClipboardList, Home, Users, Building2, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const items: Array<NavItem> = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/applications", label: "Apps", icon: ClipboardList },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/resumes", label: "Resume", icon: FileText },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to)
          return (
            <li key={it.to}>
              <Link
                to={it.to as any}
                className="flex flex-col items-center justify-center py-2 text-xs"
              >
                <it.icon className={active ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"} />
                <span className={active ? "text-primary" : "text-muted-foreground"}>{it.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}


