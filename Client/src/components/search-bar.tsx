"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Search, CircleDot, Trophy, Calendar, DollarSign, Users } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { cn } from "@/lib/utils"

// Import the competitions service
import { Competition, CompetitionsService } from "@/services/competitionService"
import { useRouter } from "next/navigation"

const GooeyFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
    <defs>
      <filter id="gooey-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
)

interface SearchBarProps {
  placeholder?: string
  onCompetitionSelect?: (competition: Competition) => void
  onSearch?: (query: string, results: Competition[]) => void
  maxResults?: number
  showCategories?: boolean
  className?: string
}

export const SearchBar = ({
  placeholder = "Search competitions...",
  onCompetitionSelect,
  onSearch,
  maxResults = 5,
  showCategories = true,
  className
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch competitions on component mount
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const competitionsData = await CompetitionsService.getCompetitions()
        console.log('Fetched competitions for search:', competitionsData)
        setCompetitions(competitionsData)
      } catch (error) {
        console.error('Error fetching competitions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [])

  const isUnsupportedBrowser = useMemo(() => {
    if (typeof window === "undefined") return false
    const ua = navigator.userAgent.toLowerCase()
    const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")
    const isChromeOniOS = ua.includes("crios")
    return isSafari || isChromeOniOS
  }, [])

  // Filter competitions based on search query
  const filteredCompetitions = useMemo(() => {
    if (!searchQuery.trim() || loading) return []
    
    const filtered = competitions.filter((competition) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        competition.title.toLowerCase().includes(searchLower) ||
        competition.category.toLowerCase().includes(searchLower)
      )
    })
    
    return filtered.slice(0, maxResults)
  }, [competitions, searchQuery, maxResults, loading])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Call onSearch callback with current query and results
    if (onSearch) {
      const results = competitions.filter((competition) => {
        const searchLower = value.toLowerCase()
        return (
          competition.title.toLowerCase().includes(searchLower) ||
          competition.category.toLowerCase().includes(searchLower)
        )
      })
      onSearch(value, results)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() && filteredCompetitions.length > 0) {
      // Select first result if no specific selection
      if (onCompetitionSelect) {
        onCompetitionSelect(filteredCompetitions[0])
      }
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }
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

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-green-500'
      case 'upcoming': return 'text-blue-500'
      case 'completed': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
      className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-blue-400"
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

        {...isFocused && loading && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 w-full mt-2 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500 mx-auto mb-2"></div>
              <span className="text-gray-500 text-sm">Searching competitions...</span>
            </div>
          </motion.div>
        )}
        {...isFocused && !loading && searchQuery && filteredCompetitions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 w-full mt-2 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-gray-500 text-sm">No competitions found for "{searchQuery}"</span>
            </div>
          </motion.div>
        )}
          animate={{
            boxShadow: isClicked
              ? "0 0 40px rgba(20, 184, 166, 0.5), 0 0 15px rgba(59, 130, 246, 0.7) inset"
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
                  "linear-gradient(90deg, #14b8a6 0%, #3b82f6 100%)",
                  "linear-gradient(90deg, #06b6d4 0%, #8b5cf6 100%)",
                  "linear-gradient(90deg, #10b981 0%, #f59e0b 100%)",
                  "linear-gradient(90deg, #14b8a6 0%, #3b82f6 100%)",
                ],
              }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          )}

          <div
            className="absolute inset-0 overflow-hidden rounded-full -z-5"
            style={{ filter: isUnsupportedBrowser ? "none" : "url(#gooey-effect)" }}
          >
            {particles}
          </div>

          {isClicked && (
            <>
              <motion.div
                className="absolute inset-0 -z-5 rounded-full bg-teal-400/10"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 -z-5 rounded-full bg-white dark:bg-white/20"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </>
          )}

          {clickParticles}

          <motion.div className="pl-4 py-3" variants={searchIconVariants} initial="initial" animate="animate">
            <Search
              size={20}
              strokeWidth={isFocused ? 2.5 : 2}
              className={cn(
                "transition-all duration-300",
                isAnimating ? "text-teal-500" : isFocused ? "text-teal-600" : "text-gray-500 dark:text-gray-300",
              )}
            />
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            placeholder={loading ? "Loading competitions..." : placeholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            disabled={loading}
            className={cn(
              "w-full py-3 bg-transparent outline-none placeholder:text-gray-700 dark:placeholder:text-gray-500 font-medium text-base relative z-10 disabled:opacity-50",
              isFocused ? "text-white dark:text-white tracking-wide" : "text-gray-600 dark:text-gray-300"
            )}
          />

          <AnimatePresence>
            {searchQuery && !loading && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                whileHover={{
                  scale: 1.05,
                  background: "linear-gradient(45deg, #14b8a6 0%, #3b82f6 100%)",
                  boxShadow: "0 10px 25px -5px rgba(20, 184, 166, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 mr-2 text-sm font-medium rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white backdrop-blur-sm transition-all shadow-lg"
              >
                Search
              </motion.button>
            )}
          </AnimatePresence>

          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.1, 0.2, 0.1, 0],
                background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 70%)",
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
            />
          )}
        </motion.div>
      </motion.form>

      <AnimatePresence>
        {isFocused && !loading && filteredCompetitions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-100 dark:border-gray-700"
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              filter: isUnsupportedBrowser ? "none" : "drop-shadow(0 15px 15px rgba(0,0,0,0.1))",
            }}
          >
            <div className="p-2">
              {filteredCompetitions.map((competition, index) => (
                <motion.div
                  key={competition.id}
                  custom={index}
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => handleCompetitionClick(competition)}
                  className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/20 group transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <motion.div 
                      initial={{ scale: 0.8 }} 
                      animate={{ scale: 1 }} 
                      transition={{ delay: index * 0.06 }}
                      className={cn("flex items-center gap-1", getStatusColor(competition.status))}
                    >
                      {getStatusIcon(competition.status)}
                    </motion.div>
                    
                    <div className="flex-1">
                      <motion.div
                        className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-teal-700 dark:group-hover:text-teal-400"
                        initial={{ x: -5, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.08 }}
                      >
                        {competition.title}
                      </motion.div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {showCategories && (
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {competition.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {competition.prize_pool}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {competition.teams}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 capitalize">
                    {competition.status}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {filteredCompetitions.length === maxResults && (
              <div className="px-4 py-2 text-center text-sm text-gray-500 border-t border-gray-100 dark:border-gray-700">
                Showing top {maxResults} results
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// // Example usage component
// const SearchBarDemo = () => {
//   const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
//   const [searchResults, setSearchResults] = useState<Competition[]>([])

//   const handleCompetitionSelect = (competition: Competition) => {
//     setSelectedCompetition(competition)
//     console.log("Selected competition:", competition)
//     // In a real app, you might navigate to the competition page:
//     // router.push(`/competition/${competition.id}`)
//   }

//   const handleSearch = (query: string, results: Competition[]) => {
//     setSearchResults(results)
//     console.log(`Search query: "${query}", Found ${results.length} results`)
//   }

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'live': return 'text-green-500'
//       case 'upcoming': return 'text-blue-500'
//       case 'completed': return 'text-gray-500'
//       default: return 'text-gray-400'
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-100 p-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="text-center mb-12">
//           <h1 className="text-4xl font-bold text-gray-900 mb-4">
//             Competition Search Bar
//           </h1>
//           <p className="text-xl text-gray-600">
//             Find your next esports competition with our smart search
//           </p>
//         </div>

//         <div className="mb-8">
//           <CompetitionSearchBar
//             placeholder="Search competitions by name, title, or category..."
//             onCompetitionSelect={handleCompetitionSelect}
//             onSearch={handleSearch}
//             maxResults={6}
//             showCategories={true}
//             className="max-w-2xl mx-auto"
//           />
//         </div>

//         {selectedCompetition && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto"
//           >
//             <h3 className="text-2xl font-bold text-gray-900 mb-2">
//               {selectedCompetition.title}
//             </h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//               <div>
//                 <span className="text-gray-500">Category:</span>
//                 <div className="font-medium">{selectedCompetition.category}</div>
//               </div>
//               <div>
//                 <span className="text-gray-500">Status:</span>
//                 <div className={cn("font-medium capitalize", getStatusColor(selectedCompetition.status))}>
//                   {selectedCompetition.status}
//                 </div>
//               </div>
//               <div>
//                 <span className="text-gray-500">Prize Pool:</span>
//                 <div className="font-medium">{selectedCompetition.prize_pool}</div>
//               </div>
//               <div>
//                 <span className="text-gray-500">Teams:</span>
//                 <div className="font-medium">{selectedCompetition.teams}</div>
//               </div>
//             </div>
//             <div className="mt-4 pt-4 border-t border-gray-200">
//               <span className="text-gray-500 text-sm">Duration:</span>
//               <div className="text-sm">{selectedCompetition.start_date} - {selectedCompetition.end_date}</div>
//             </div>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default SearchBarDemo