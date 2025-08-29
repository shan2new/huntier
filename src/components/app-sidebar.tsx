import * as React from "react"
import { BarChart3, Calendar, ChevronsUpDown, ClipboardList, FileText, Globe, Home, LogOut, Mail, Star, Target, Trophy, User } from "lucide-react"
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
                  <span>Resumes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={appsActive("/mail")} tooltip="Mail">
                <Link to="/mail" className="font-medium">
                  <Mail className="mr-2" size={16} />
                  <span>Mail</span>
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
