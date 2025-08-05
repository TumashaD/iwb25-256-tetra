"use client"

import * as React from "react"
import { User, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AvatarDropdownProps {
  children: React.ReactNode
  className?: string
}

export function AvatarDropdown({ children, className }: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const { authUser, signOut } = useAuth()
  const router = useRouter()

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      setIsOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleProfile = () => {
    setIsOpen(false)
    // Navigate to profile page (you can implement this route)
    router.push('/profile')
  }

  const handleSettings = () => {
    setIsOpen(false)
    // Navigate to settings page (you can implement this route)
    router.push('/settings')
  }

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      onClick: handleProfile,
      className: 'hover:bg-white/10'
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: handleSettings,
      className: 'hover:bg-white/10'
    },
    {
      icon: LogOut,
      label: 'Logout',
      onClick: handleLogout,
      className: 'hover:bg-red-500/20 text-red-300'
    }
  ]

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full transition-all duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {children}
      </button>

      {/* Liquid Glassy Dropdown */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-56 origin-top-right",
          "sm:right-0 max-sm:right-1/2 max-sm:transform max-sm:translate-x-1/2",
          "transform transition-all duration-300 ease-out",
          isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        )}
      >
        {/* Backdrop blur container */}
        <div className="relative">
          {/* Liquid shape background */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
            {/* Animated liquid effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse opacity-60" />
            {/* Glass refraction effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-40" />
          </div>

          {/* Content */}
          <div className="relative z-10 py-3 px-2">
            {/* User info header */}
            <div className="px-3 py-2 mb-2 border-b border-white/10">
              <p className="text-sm font-medium text-white/90 truncate">
                {authUser?.user_metadata?.full_name || authUser?.email || 'User'}
              </p>
              <p className="text-xs text-white/60 truncate">
                {authUser?.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 text-sm rounded-xl",
                      "text-white/80 transition-all duration-200",
                      "group relative overflow-hidden",
                      item.className
                    )}
                  >
                    {/* Hover background effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Icon with liquid animation */}
                    <div className="relative z-10 mr-3 p-1 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Label */}
                    <span className="relative z-10 font-medium group-hover:text-white transition-colors duration-300">
                      {item.label}
                    </span>

                    {/* Ripple effect on hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom glow effect */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-lg rounded-full opacity-60" />
        </div>
      </div>
    </div>
  )
}
