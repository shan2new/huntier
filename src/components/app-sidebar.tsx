import * as React from "react"
import { Calendar, ChevronsUpDown, ClipboardList, FileText, Home, LogOut, Star, Target, Trophy, User } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"
import { useAuth, useUser } from "@clerk/clerk-react"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { user } = useUser()
  const { signOut } = useAuth()

  const appsActive = (path: string) => location.pathname.startsWith(path)

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Huntier">
              <Link to="/dashboard">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img src="/logo512.svg" alt="Huntier" />
                </div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-lg font-bold">Huntier</span>
                  <Badge variant="secondary" className="h-5 px-2 py-0 text-[10px]">Beta</Badge>
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

        <SidebarSeparator />

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
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/applications/wishlist")} tooltip="Wishlist">
                <Link to="/applications/wishlist" className="font-medium">
                  <Star className="mr-2" size={16} />
                  <span>Wishlist</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/applications/in-progress")} tooltip="In-progress">
                <Link to="/applications/in-progress" className="font-medium">
                  <Target className="mr-2" size={16} />
                  <span>In-progress</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/applications/interviewing")} tooltip="Interviewing">
                <Link to="/applications/interviewing" className="font-medium">
                  <Calendar className="mr-2" size={16} />
                  <span>Interviewing</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/applications/completed")} tooltip="Completed">
                <Link to="/applications/completed" className="font-medium">
                  <Trophy className="mr-2" size={16} />
                  <span>Completed</span>
                </Link>
              </SidebarMenuButton>
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

        <SidebarSeparator />

        {/* Personal */}
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/resumes")} tooltip="Resumes">
                <Link to="/resumes" className="font-medium">
                  <FileText className="mr-2" size={16} />
                  <span>Resumes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/profile")} tooltip="Profile">
                <Link to="/profile" className="font-medium">
                  <User className="mr-2" size={16} />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
