'use client'
import { Calendar, FileText, Globe, Home, Inbox, LogIn, LogOut, LucideLayoutDashboard, MoreHorizontal, Search, Settings, Trophy, User, Wrench } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { use, useMemo } from "react"
import { a } from "node_modules/framer-motion/dist/types.d-Cjd591yU"

// Menu items.
const navigationItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Trophy, label: "Competitions", href: "/competitions" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Globe, label: "About Us", href: "/about" },
  { icon: FileText, label: "News", href: "/news" },
  { icon: LucideLayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: Search, label: "Search", href: "/search" },
]

export function AppSidebar() {

const { user, loading, signOut } = useAuth();
const router = useRouter();

const cachedUser = useMemo(() => ({
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
    isAuthenticated: !!user
  }), [user?.email, user?.avatarUrl]);

const handleLogout = async () => {
    try {
        await signOut();
        router.push("/");
    } catch (error) {
        console.error("Error signing out:", error);
    }
}
    
  return (
    <Sidebar className="w-24 h-screen shadow-slate-300 shadow-lg fixed z-50" collapsible="none">
      <SidebarHeader className="p-4 flex items-center justify-center">
        <h1 className="text-lg font-semibold pt-4">V</h1>
      </SidebarHeader>

      <SidebarContent className="justify-center">
        <SidebarGroup>
          <SidebarGroupContent className="items-center">
            <SidebarMenu className="space-y-2 flex flex-col items-center justify-center">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild className="h-full w-20 space-y-6" >
                      <Link className="flex flex-col items-center justify-center" href={item.href}>
                        <Icon className="m-0 h-6 w-6" />
                        <span className="text-[10px] text-center leading-tight font-medium text-muted-foreground">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex items-center justify-center">
        {loading?(
            <div className="animate-spin h-5 w-5 border-4 border-t-transparent border-gray-200 rounded-full"></div>
        ) : cachedUser.isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="group relative transition-transform hover:scale-105 cursor-pointer"
            >
              <Avatar className="h-10 w-10">
            <AvatarImage src={cachedUser.avatarUrl} />
            <AvatarFallback className="bg-gray-300 text-gray-700">
                              {cachedUser.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-destructive rounded-full group-hover:opacity-100 transition-opacity">
            <LogOut className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
        </button>
        ) : (
            <Link className="flex items-center justify-center bg-cyan-500 rounded-full p-3 hover:bg-cyan-600 hover:scale-105 transition-colors" href="/signup">
              <LogIn className="h-6 w-6 text-white" strokeWidth={2} />
            </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}