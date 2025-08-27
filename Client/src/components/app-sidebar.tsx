"use client"
import {
  Calendar,
  FileText,
  Globe,
  Home,
  LogIn,
  LogOut,
  LucideLayoutDashboard,
  Search,
  Settings,
  Trophy,
  User,
  Wrench,
  ChevronLeft,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  ChevronRight,
  ViewIcon,
  GlobeIcon,
  Edit3Icon,
  LogInIcon,
} from "lucide-react"
import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Link from "next/link"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useMemo, useState, useEffect } from "react"
import { Competition, CompetitionsService } from "@/services/competitionService"
import RegisterButton from "./register-button"
import { EnrollmentService, EnrollmentWithDetails } from "@/services/enrollmentService"

type NavigationItem = {
  icon?: React.ElementType
  label: string
  href?: string 
  custom?: React.ReactNode
}

// Main navigation items
const mainNavigationItems: NavigationItem[] = [
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
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { id } = useParams()
  const [showSubNav, setShowSubNav] = useState(false)
  const [currentSubNav, setCurrentSubNav] = useState<string>("")
  const [showFrontButton, setShowFrontButton] = useState(false)

  const subNavigationItems: Record<string, NavigationItem[]> = {
    "/dashboard/organizer/competition": [
      { icon: GlobeIcon, label: "Webpage", href: `/dashboard/organizer/competition/${id}` },
      { icon: Edit3Icon, label: "Edit Page", href: `/dashboard/organizer/competition/${id}/edit` },
      { icon: Users, label: "Teams", href: `/dashboard/organizer/competition/${id}/teams` },
      { icon: Settings, label: "Settings", href: `/dashboard/organizer/competition/${id}/settings` },
    ],
    "/competition": [
      {
        custom: (
          <RegisterButton className="w-full bg-white text-black py-3 px-4 rounded-xl font-medium transition-colors duration-200" text="Register" competitionId={Number(id)} />
        ),
        label: "Register",
      }
    ]
  }

  const cachedUser = useMemo(() => ({
    id: user?.id,
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
    isAuthenticated: !!user,
    role: user?.profile?.role
  }), [user?.email, user?.avatarUrl ,user?.profile]);

  const isOrganizer = async () => {
    let competition: Competition;
    try {
      competition = await CompetitionsService.getCompetition(Number(id));
      if (cachedUser.id === competition?.organizer_id) {
        setCurrentSubNav("/dashboard/organizer/competition");
        setShowSubNav(true);
      }
    } catch (error) {
      console.error("Error fetching competition:", error);
    }
  }

  const isEnrolled = async () => {
    let enrollments : EnrollmentWithDetails[] = [];
    try {
      enrollments = await EnrollmentService.getUserEnrollments(cachedUser.id ? cachedUser.id : user?.id ? user.id : "");
      if (enrollments.length > 0) {
        const enrolledCompetitionIds = enrollments.map(e => e.competition_id);
        if (enrolledCompetitionIds.includes(Number(id))) {
          setShowSubNav(false);
        } else {
          setCurrentSubNav("/competition");
          setShowSubNav(true);
        }
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  }

  useEffect(() => {
    const paths = pathname.split("/")
    const basePath = "/" + paths.slice(1, 4).join("/")
    console.log(basePath)
    if (basePath.startsWith("/competition/")) {
      if (cachedUser.role === "organizer") {
        isOrganizer();
      } else {
        isEnrolled();
      }
    }
    if (subNavigationItems[basePath as keyof typeof subNavigationItems]) {
      setCurrentSubNav(basePath)
      setShowSubNav(true)
    } else {
      setShowSubNav(false)
      setShowFrontButton(false)
      setCurrentSubNav("")
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    const basePath = href
    if (subNavigationItems[basePath as keyof typeof subNavigationItems]) {
      e.preventDefault()
      setCurrentSubNav(basePath)
      setShowSubNav(true)
      router.push(href)
    }
  }

  const handleBackClick = () => {
    setShowSubNav(false)
    setShowFrontButton(true)
  }

  const handleFrontClick = () => {
    setShowFrontButton(false)
    setShowSubNav(true)
  }

  return (
    <Sidebar className="w-24 h-screen shadow-slate-300 shadow-lg fixed z-50 overflow-hidden" collapsible="none">
      <SidebarHeader className="p-4 flex items-center justify-center">
        <h1 className="text-lg font-semibold pt-4">V</h1>
      </SidebarHeader>

      <SidebarContent className="justify-center relative">
        <SidebarGroup>
          <SidebarGroupContent className="items-center">
            {/* {showSubNav && (
              <div className="w-full flex justify-center mb-4">
                <button
                  onClick={handleBackClick}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
            {showFrontButton && (
              <div className="w-full flex justify-center mb-4">
                <button
                  onClick={handleFrontClick}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )} */}

            <div className="relative w-full overflow-hidden">
              <div
                className={`transition-transform duration-300 ease-in-out ${showSubNav ? "-translate-x-1/2" : "translate-x-0"
                  }`}
                style={{ width: "200%" }}
              >
                <div className="flex">
                  {/* Main Navigation */}
                  <div className="w-1/2 flex justify-center">
                    <SidebarMenu className="space-y-2 flex flex-col items-center justify-center">
                      {mainNavigationItems.map((item) => {
                        const Icon = item.icon ? item.icon : ViewIcon;
                        return (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton asChild className="h-full w-20 space-y-6">
                              <Link
                                className="flex flex-col items-center justify-center"
                                href={item.href ? item.href : "#"}
                                onClick={(e) => handleNavClick(item.href ? item.href : "#", e)}
                              >
                                <Icon className="m-0 h-6 w-6" />
                                <span className="text-[10px] text-center leading-tight font-medium text-muted-foreground">
                                  {item.label}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                      {/* Front Button */}
                      {showFrontButton && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-full w-20 space-y-6" onClick={handleFrontClick}>
                            <div className="flex flex-col items-center justify-center">
                              <ChevronRight className="m-0 h-6 w-6" />
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </div>

                  {/* Sub Navigation */}
                  <div className="w-1/2 flex justify-center">
                    <SidebarMenu className="space-y-2 flex flex-col items-center justify-center">
                      {currentSubNav && (
                        subNavigationItems[currentSubNav as keyof typeof subNavigationItems]?.map((item) => (
                          <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton asChild className="h-full w-20 space-y-6">
                                {item.custom ? (
                                  item.custom
                                ) : (
                                  <Link className="flex flex-col items-center justify-center" href={item.href ? item.href : "#"}>
                                    {item.icon && <item.icon className="m-0 h-6 w-6" />}
                                    <span className="text-[10px] text-center leading-tight font-medium text-muted-foreground">
                                      {item.label}
                                    </span>
                                  </Link>
                                )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                      )}
                      {/* Back Button */}
                      {showSubNav && (
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild className="h-full w-20 space-y-6" onClick={handleBackClick}>
                            <div className="flex flex-col items-center justify-center">
                              <ChevronLeft className="m-0 h-6 w-6" />
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </SidebarMenu>
                  </div>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex items-center justify-center">
        {loading ? (
          <div className="animate-spin h-5 w-5 border-4 border-t-transparent border-gray-200 rounded-full"></div>
        ) : cachedUser.isAuthenticated ? (
          <button onClick={handleLogout} className="group relative transition-transform hover:scale-105 cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarImage src={cachedUser.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-gray-300 text-gray-700">
                {cachedUser.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-destructive rounded-full group-hover:opacity-100 transition-opacity">
              <LogOut className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
          </button>
        ) : (
          <Link
            className="flex items-center justify-center bg-cyan-500 rounded-full p-3 hover:bg-cyan-600 hover:scale-105 transition-colors"
            href="/signup"
          >
            <LogIn className="h-6 w-6 text-white" strokeWidth={2} />
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}