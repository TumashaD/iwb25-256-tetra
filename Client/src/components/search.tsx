"use client"

/**
 * UnifiedSearch Component
 * 
 * A comprehensive search component that combines both user and competition search functionality
 * into a single, elegant interface. Features animated interactions, real-time search results,
 * and seamless navigation to selected items.
 * 
 * Features:
 * - Searches both users and competitions simultaneously
 * - Real-time search with debouncing
 * - Animated UI with particle effects
 * - Categorized results display
 * - Keyboard navigation support
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <UnifiedSearch 
 *   placeholder="Search competitions and users..."
 *   onUserSelect={(user) => console.log('Selected user:', user)}
 *   onCompetitionSelect={(competition) => console.log('Selected competition:', competition)}
 *   maxResults={10}
 * />
 * ```
 */

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, User as UserIcon, Mail, Users, Trophy, Calendar, CircleDot, DollarSign } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { UserService, type Profile } from "@/services/userService"
import { CompetitionsService, type Competition } from "@/services/competitionService"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const GooeyFilter = () => (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <defs>
            <filter id="gooey-effect-unified">
                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
        </defs>
    </svg>
)

type SearchResult = {
    type: 'user' | 'competition'
    data: Profile | Competition
}

interface UnifiedSearchProps {
    placeholder?: string
    onUserSelect?: (user: Profile) => void
    onCompetitionSelect?: (competition: Competition) => void
    onSearch?: (query: string, results: SearchResult[]) => void
    maxResults?: number
    className?: string
}

export const UnifiedSearch = ({
    placeholder = "Search competitions or users...",
    onUserSelect,
    onCompetitionSelect,
    onSearch,
    maxResults = 8,
    className
}: UnifiedSearchProps) => {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAnimating, setIsAnimating] = useState(false)
    const [isClicked, setIsClicked] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [users, setUsers] = useState<Profile[]>([])
    const [competitions, setCompetitions] = useState<Competition[]>([])
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    const isUnsupportedBrowser = useMemo(() => {
        if (typeof window === "undefined") return false
        const ua = navigator.userAgent.toLowerCase()
        const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")
        const isChromeOniOS = ua.includes("crios")
        return isSafari || isChromeOniOS
    }, [])

    // Load competitions on mount
    useEffect(() => {
        const loadCompetitions = async () => {
            try {
                const competitionsData = await CompetitionsService.getCompetitions()
                setCompetitions(competitionsData)
            } catch (error) {
                console.error('Error loading competitions:', error)
            } finally {
                setInitialLoading(false)
            }
        }
        loadCompetitions()
    }, [])

    // Search logic
    useEffect(() => {
        const performSearch = async () => {
            if (!searchQuery.trim()) {
                setUsers([])
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                // Search users
                const userResults = await UserService.searchUsers(searchQuery)
                setUsers(userResults.slice(0, Math.floor(maxResults / 2)))

                // Filter competitions locally
                const competitionResults = competitions.filter((competition) => {
                    const searchLower = searchQuery.toLowerCase()
                    return (
                        competition.title.toLowerCase().includes(searchLower) ||
                        competition.category.toLowerCase().includes(searchLower)
                    )
                }).slice(0, Math.floor(maxResults / 2))

                // Combine results for callback
                if (onSearch) {
                    const combinedResults: SearchResult[] = [
                        ...userResults.map(user => ({ type: 'user' as const, data: user })),
                        ...competitionResults.map(competition => ({ type: 'competition' as const, data: competition }))
                    ]
                    onSearch(searchQuery, combinedResults)
                }
            } catch (error) {
                console.error('Error searching:', error)
                setUsers([])
            } finally {
                setLoading(false)
            }
        }

        const timeoutId = setTimeout(performSearch, 300) // Debounce search
        return () => clearTimeout(timeoutId)
    }, [searchQuery, competitions, maxResults, onSearch])

    // Filter competitions based on search query
    const filteredCompetitions = useMemo(() => {
        if (!searchQuery.trim() || initialLoading) return []

        const filtered = competitions.filter((competition) => {
            const searchLower = searchQuery.toLowerCase()
            return (
                competition.title.toLowerCase().includes(searchLower) ||
                competition.category.toLowerCase().includes(searchLower)
            )
        })

        return filtered.slice(0, Math.floor(maxResults / 2))
    }, [competitions, searchQuery, maxResults, initialLoading])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            if (users.length > 0) {
                handleUserClick(users[0])
            } else if (filteredCompetitions.length > 0) {
                handleCompetitionClick(filteredCompetitions[0])
            }
            setIsAnimating(true)
            setTimeout(() => setIsAnimating(false), 1000)
        }
    }

    const handleUserClick = (user: Profile) => {
        setSearchQuery(user.name)
        setIsFocused(false)
        if (onUserSelect) {
            onUserSelect(user)
        }
        router.push(`/users/${user.id}`)
    }

    const handleCompetitionClick = (competition: Competition) => {
        setSearchQuery(competition.title)
        setIsFocused(false)
        if (onCompetitionSelect) {
            onCompetitionSelect(competition)
        }
        router.push(`/competitions/${competition.id}`)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isFocused) {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            })
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
        setIsClicked(true)
        setTimeout(() => setIsClicked(false), 800)
    }

    const searchIconVariants: Variants = {
        initial: { scale: 1 },
        animate: {
            rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : 0,
            scale: isAnimating ? [1, 1.3, 1] : 1,
            transition: { duration: 0.6, ease: "easeInOut" },
        },
    }

    const suggestionVariants: Variants = {
        hidden: (i: number) => ({
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: { duration: 0.15, delay: i * 0.05 },
        }),
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 15, delay: i * 0.07 },
        }),
        exit: (i: number) => ({
            opacity: 0,
            y: -5,
            scale: 0.9,
            transition: { duration: 0.1, delay: i * 0.03 },
        }),
    }

    const getUserInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'competitor': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'organizer': return 'bg-purple-100 text-purple-700 border-purple-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'competitor': return <Trophy className="w-3 h-3" />
            case 'organizer': return <Users className="w-3 h-3" />
            default: return <UserIcon className="w-3 h-3" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-500'
            case 'upcoming': return 'text-blue-500'
            case 'completed': return 'text-gray-500'
            default: return 'text-gray-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            case 'upcoming': return <Calendar className="w-3 h-3" />
            case 'completed': return <Trophy className="w-3 h-3" />
            default: return <CircleDot className="w-3 h-3" />
        }
    }

    const particles = Array.from({ length: isFocused ? 18 : 0 }, (_, i) => (
        <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40],
                scale: [0, Math.random() * 0.8 + 0.4],
                opacity: [0, 0.8, 0],
            }}
            transition={{
                duration: Math.random() * 1.5 + 1.5,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
            }}
            className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: "blur(2px)",
            }}
        />
    ))

    const clickParticles = isClicked
        ? Array.from({ length: 14 }, (_, i) => (
            <motion.div
                key={`click-${i}`}
                initial={{ x: mousePosition.x, y: mousePosition.y, scale: 0, opacity: 1 }}
                animate={{
                    x: mousePosition.x + (Math.random() - 0.5) * 160,
                    y: mousePosition.y + (Math.random() - 0.5) * 160,
                    scale: Math.random() * 0.8 + 0.2,
                    opacity: [1, 0],
                }}
                transition={{ duration: Math.random() * 0.8 + 0.5, ease: "easeOut" }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                    background: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 200) + 55}, ${Math.floor(Math.random() * 255)}, 0.8)`,
                    boxShadow: "0 0 8px rgba(255, 255, 255, 0.8)",
                }}
            />
        ))
        : null

    const hasResults = users.length > 0 || filteredCompetitions.length > 0

    return (
        <div className={cn("relative w-full", className)}>
            <GooeyFilter />
            <motion.form
                onSubmit={handleSubmit}
                className="relative flex items-center justify-center w-full mx-auto"
                initial={{ width: "400px" }}
                animate={{ width: isFocused ? "440px" : "400px", scale: isFocused ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                onMouseMove={handleMouseMove}
            >
                <motion.div
                    className={cn(
                        "flex items-center w-full rounded-full border relative overflow-hidden backdrop-blur-md gap-2",
                        isFocused ? "border-transparent shadow-xl" : "border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-800/50"
                    )}
                    animate={{
                        boxShadow: isClicked
                            ? "0 0 40px rgba(16, 185, 129, 0.5), 0 0 15px rgba(6, 182, 212, 0.7) inset"
                            : isFocused
                                ? "0 15px 35px rgba(0, 0, 0, 0.2)"
                                : "0 0 0 rgba(0, 0, 0, 0)",
                    }}
                    onClick={handleClick}
                >
                    {isFocused && (
                        <motion.div
                            className="absolute inset-0 -z-10"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 0.15,
                                background: [
                                    "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
                                    "linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)",
                                    "linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)",
                                    "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
                                ],
                            }}
                            transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        />
                    )}

                    <div
                        className="absolute inset-0 overflow-hidden rounded-full -z-5"
                        style={{ filter: isUnsupportedBrowser ? "none" : "url(#gooey-effect-unified)" }}
                    >
                        {particles}
                    </div>

                    {clickParticles}

                    <motion.div className="pl-4 py-3" variants={searchIconVariants} initial="initial" animate="animate">
                        <Search
                            size={20}
                            strokeWidth={isFocused ? 2.5 : 2}
                            className={cn(
                                "transition-all duration-300",
                                isAnimating ? "text-emerald-500" : isFocused ? "text-emerald-600" : "text-gray-500 dark:text-gray-300",
                            )}
                        />
                    </motion.div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={initialLoading ? "Loading..." : placeholder}
                        value={searchQuery}
                        onChange={handleSearch}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        disabled={initialLoading}
                        className={cn(
                            "w-full py-3 bg-transparent outline-none placeholder:text-gray-700 dark:placeholder:text-gray-500 font-medium text-base relative z-10 disabled:opacity-50",
                            isFocused ? "text-white dark:text-white tracking-wide" : "text-gray-600 dark:text-gray-300"
                        )}
                    />

                    <AnimatePresence>
                        {isFocused && loading && searchQuery && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2"
                            >
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isFocused && !loading && searchQuery && !hasResults && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 text-sm"
                        >
                            No results found
                        </motion.div>
                    )}
                </motion.div>
            </motion.form>

            <AnimatePresence>
                {isFocused && !loading && hasResults && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute top-full left-0 right-0 mt-3 z-50"
                    >
                        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 shadow-xl">
                            <CardContent className="p-2">
                                <div className="max-h-96 overflow-y-auto">
                                    {/* Users Section */}
                                    {users.length > 0 && (
                                        <>
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Users
                                            </div>
                                            {users.map((user, index) => (
                                                <motion.div
                                                    key={`user-${user.id}`}
                                                    custom={index}
                                                    variants={suggestionVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    onClick={() => handleUserClick(user)}
                                                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 group"
                                                >
                                                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                                                        <AvatarImage src={user.avatar_url} alt={user.name} />
                                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white text-sm font-bold">
                                                            {getUserInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                                {user.name}
                                                            </h4>
                                                            <Badge variant="secondary" className={cn("px-2 py-0.5 text-xs capitalize", getRoleColor(user.role))}>
                                                                {getRoleIcon(user.role)}
                                                                <span className="ml-1">{user.role}</span>
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate">{user.email}</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </>
                                    )}

                                    {/* Competitions Section */}
                                    {filteredCompetitions.length > 0 && (
                                        <>
                                            {users.length > 0 && <div className="border-t border-gray-100 dark:border-gray-700 my-2" />}
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                Competitions
                                            </div>
                                            {filteredCompetitions.map((competition, index) => (
                                                <motion.div
                                                    key={`competition-${competition.id}`}
                                                    custom={index + users.length}
                                                    variants={suggestionVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    onClick={() => handleCompetitionClick(competition)}
                                                    className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                                            <Trophy className="w-5 h-5 text-white" />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                                    {competition.title}
                                                                </h4>
                                                                <div className="flex items-center gap-1">
                                                                    {getStatusIcon(competition.status)}
                                                                    <span className={cn("text-xs font-medium capitalize", getStatusColor(competition.status))}>
                                                                        {competition.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                                <span className="truncate">{competition.category}</span>
                                                                {competition.prize_pool && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <div className="flex items-center gap-1">
                                                                            <DollarSign className="w-3 h-3" />
                                                                            <span>{competition.prize_pool}</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <span>•</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    <span>{competition.teams} teams</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}