import { Link } from "@tanstack/react-router"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function MobileTopBar() {
  return (
    <div className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-3 px-3">
        <SidebarTrigger className="-ml-1" />
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo192.svg" alt="Huntier" className="h-6 w-6 rounded-sm" />
          <span className="text-base font-semibold leading-none">Huntier</span>
        </Link>
      </div>
    </div>
  )
}


