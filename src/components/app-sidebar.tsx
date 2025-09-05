import * as React from "react"
import { BarChart3, Building2, Calendar, ChevronsUpDown, ClipboardList, FileText, FolderTree, Globe, Home, LogOut, Network, Star, Target, Trophy, User, Users } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useAuthToken } from "@/lib/auth"
import { listMyCompanyGroupsWithRefresh } from "@/lib/api"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function SparklesGradient({ size = 10, className = "", strokeWidth = 2 }: { size?: number | string; className?: string; strokeWidth?: number }) {
  const gradientId = React.useId()
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user } = useUser()
  const { signOut } = useAuth()
  const { getToken } = useAuthToken()
  const [companyGroups, setCompanyGroups] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    ;(async () => {
      try {
        const groups = await listMyCompanyGroupsWithRefresh(getToken)
        setCompanyGroups(groups as any)
      } catch {}
    })()
  }, [getToken])

  const appsActive = (path: string) => location.pathname.startsWith(path)

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Huntier">
              <Link to="/dashboard">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center">
                  <img src="/logo512.svg" alt="Huntier" />
                </div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-lg font-bold">Huntier</span>
                  <Badge variant="secondary" className="h-4 px-1 py-0 text-[10px] rounded-xs">Beta</Badge>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"} tooltip="Dashboard">
                <Link to="/dashboard" className="font-medium">
                  <Home className="mr-2" size={16} />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Applications */}
        <SidebarGroup>
          <SidebarGroupLabel>Applications</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/applications"} tooltip="All applications">
                <Link to="/applications" className="font-medium">
                  <ClipboardList className="mr-2" size={16} />
                  <span>All</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* Milestones sub-navigation */}
            <SidebarMenuItem>
              <div className="px-2 text-xs text-muted-foreground mt-1">Milestones</div>
              <SidebarMenuSub>
                <SidebarMenuSubItem className="mt-2">
                  <SidebarMenuSubButton asChild isActive={appsActive("/applications/wishlist")}>
                    <Link to="/applications/wishlist" className="flex items-center gap-2">
                      <Star size={14} />
                      <span>Wishlist</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={appsActive("/applications/in-progress")}>
                    <Link to="/applications/in-progress" className="flex items-center gap-2">
                      <Target size={14} />
                      <span>Screening</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={appsActive("/applications/interviewing")}>
                    <Link to="/applications/interviewing" className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>Interviewing</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={appsActive("/applications/completed")}>
                    <Link to="/applications/completed" className="flex items-center gap-2">
                      <Trophy size={14} />
                      <span>Completed</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/board")} tooltip="Board">
                <Link to="/board" className="font-medium">
                  <Target className="mr-2" size={16} />
                  <span>Board</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Companies */}
        <SidebarGroup>
          <SidebarGroupLabel>Companies</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/companies"} tooltip="All companies">
                <Link to="/companies" className="font-medium">
                  <Building2 className="mr-2" size={16} />
                  <span>All</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="px-2 text-xs text-muted-foreground mt-1">Groups</div>
              <SidebarMenuSub>
                <SidebarMenuSubItem className="mt-2">
                  <SidebarMenuSubButton asChild isActive={appsActive("/companies/groups") && location.pathname === "/companies/groups"}>
                    <Link to="/companies/groups" className="flex items-center gap-2">
                      <FolderTree size={14} />
                      <span>All groups</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                {companyGroups.slice(0, 6).map((g) => (
                  <SidebarMenuSubItem key={g.id}>
                    <SidebarMenuSubButton asChild isActive={location.pathname === `/companies/groups/${g.id}`} >
                      <Link to="/companies/groups/$groupId" params={{ groupId: g.id }} className="flex items-center gap-2">
                        <FolderTree size={14} />
                        <span className="truncate max-w-[140px]">{g.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Network */}
        <SidebarGroup>
          <SidebarGroupLabel>Network</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/contacts")} tooltip="Contacts">
                <Link to="/contacts" className="font-medium">
                  <Users className="mr-2" size={16} />
                  <span>Contacts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/referrers")} tooltip="Referrers">
                <Link to="/referrers" className="font-medium">
                  <Network className="mr-2" size={16} />
                  <span>Referrers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Insights */}
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/platforms")} tooltip="Platforms">
                <Link to="/platforms" className="font-medium">
                  <Globe className="mr-2" size={16} />
                  <span>Platforms</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/dashboard")} tooltip="Analytics">
                <Link to="/dashboard" className="font-medium">
                  <BarChart3 className="mr-2" size={16} />
                  <span>Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {/* Personal */}
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/resumes")} tooltip="Resumes">
                <Link to="/resumes" className="font-medium">
                  <FileText className="mr-2" size={16} />
                  <span>Resume AI <SparklesGradient size={10} className="ml-2 inline-block align-middle" /> </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="px-2 text-xs text-muted-foreground mt-1">Autofill</div>
              <SidebarMenuSub>
                <SidebarMenuSubItem className="mt-2">
                  <SidebarMenuSubButton asChild isActive={appsActive("/autofill/inputs")}>
                    <Link to="/autofill/inputs" className="flex items-center gap-2">
                      <span>Inputs</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild isActive={appsActive("/autofill/templates")}>
                    <Link to="/autofill/templates" className="flex items-center gap-2">
                      <span>Templates</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
            {/* Mail disabled */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-md p-2 text-left outline-hidden focus-visible:ring-2">
              <Avatar className="size-8">
                <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || "User"} />
                <AvatarFallback>{(user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user?.fullName || "Account"}</div>
                <div className="text-xs text-muted-foreground truncate">Pro Plan</div>
              </div>
              <ChevronsUpDown className="size-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || "User"} />
                  <AvatarFallback>{(user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "")}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-none truncate">{user?.fullName || "Account"}</div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-xs text-muted-foreground truncate underline decoration-dotted underline-offset-2">Pro Plan</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      Enjoy full Pro features during our beta period at no cost.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="mr-2 size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="mr-2 size-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
