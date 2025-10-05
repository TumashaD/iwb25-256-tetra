// "use client"

// import React, { useState, useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { UserSearch } from "@/components/user-search"
// import { UserService, type Profile } from "@/services/userService"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { User, Users, Trophy, Mail, Calendar, ArrowLeft } from "lucide-react"
// import { motion } from "framer-motion"
// import { cn } from "@/lib/utils"

// export default function UsersPage() {
//     const router = useRouter()
//     const [searchResults, setSearchResults] = useState<Profile[]>([])
//     const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
//     const [searchQuery, setSearchQuery] = useState("")

//     const handleUserSelect = (user: Profile) => {
//         setSelectedUser(user)
//         router.push(`/users/${user.id}`)
//     }

//     const handleSearch = (query: string, results: Profile[]) => {
//         setSearchQuery(query)
//         setSearchResults(results)
//     }

//     const getUserInitials = (name: string) => {
//         return name
//             .split(" ")
//             .map((word) => word.charAt(0))
//             .join("")
//             .toUpperCase()
//             .slice(0, 2)
//     }

//     const getRoleColor = (role: string) => {
//         switch (role) {
//             case 'competitor': return 'bg-blue-100 text-blue-700 border-blue-200'
//             case 'organizer': return 'bg-purple-100 text-purple-700 border-purple-200'
//             default: return 'bg-gray-100 text-gray-700 border-gray-200'
//         }
//     }

//     const getRoleIcon = (role: string) => {
//         switch (role) {
//             case 'competitor': return <Trophy className="w-4 h-4" />
//             case 'organizer': return <Users className="w-4 h-4" />
//             default: return <User className="w-4 h-4" />
//         }
//     }

//     const formatDate = (dateString?: string) => {
//         if (!dateString) return "2024"
//         try {
//             return new Date(dateString).getFullYear().toString()
//         } catch {
//             return "2024"
//         }
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
//             {/* Header */}
//             <div className="border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
//                 <div className="max-w-6xl mx-auto px-4 py-4">
//                     <div className="flex items-center justify-between">
//                         <Button
//                             onClick={() => router.back()}
//                             variant="ghost"
//                             className="flex items-center gap-2 hover:bg-gray-100"
//                         >
//                             <ArrowLeft className="w-4 h-4" />
//                             Back
//                         </Button>

//                         <div className="flex items-center gap-2 text-sm text-gray-600">
//                             <Users className="w-4 h-4" />
//                             Find Users
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="py-8 px-4">
//                 <div className="max-w-6xl mx-auto">
//                     {/* Title and Description */}
//                     <div className="text-center mb-12">
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ duration: 0.6 }}
//                         >
//                             <h1 className="text-4xl font-bold text-gray-900 mb-4">
//                                 Find Other Users
//                             </h1>
//                             <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//                                 Search and discover other competitors and organizers in the community.
//                                 View their profiles, explore their projects, and connect with fellow enthusiasts.
//                             </p>
//                         </motion.div>
//                     </div>

//                     {/* Search Bar */}
//                     <motion.div
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.6, delay: 0.2 }}
//                         className="mb-8"
//                     >
//                         <UserSearch
//                             placeholder="Search users by name or email..."
//                             onUserSelect={handleUserSelect}
//                             onSearch={handleSearch}
//                             maxResults={8}
//                             className="max-w-2xl mx-auto"
//                         />
//                     </motion.div>

//                     {/* Search Results */}
//                     {searchQuery && (
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ duration: 0.6, delay: 0.4 }}
//                         >
//                             <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
//                                 <CardHeader>
//                                     <CardTitle className="flex items-center gap-2">
//                                         <Users className="w-5 h-5" />
//                                         Search Results
//                                         {searchResults.length > 0 && (
//                                             <Badge variant="secondary" className="ml-2">
//                                                 {searchResults.length} found
//                                             </Badge>
//                                         )}
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent>
//                                     {searchResults.length === 0 ? (
//                                         <div className="text-center py-12">
//                                             <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                                             <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
//                                             <p className="text-gray-600">
//                                                 Try searching with a different name or email address.
//                                             </p>
//                                         </div>
//                                     ) : (
//                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                                             {searchResults.map((user, index) => (
//                                                 <motion.div
//                                                     key={user.id}
//                                                     initial={{ opacity: 0, y: 20 }}
//                                                     animate={{ opacity: 1, y: 0 }}
//                                                     transition={{ duration: 0.4, delay: index * 0.1 }}
//                                                 >
//                                                     <Card
//                                                         className="cursor-pointer transition-all hover:shadow-md hover:scale-105 bg-white/80 backdrop-blur-sm"
//                                                         onClick={() => handleUserSelect(user)}
//                                                     >
//                                                         <CardContent className="p-6">
//                                                             <div className="flex items-center space-x-4">
//                                                                 <Avatar className="w-12 h-12 border-2 border-white shadow-md">
//                                                                     <AvatarImage src="/placeholder.svg" alt={user.name} />
//                                                                     <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-bold">
//                                                                         {getUserInitials(user.name)}
//                                                                     </AvatarFallback>
//                                                                 </Avatar>

//                                                                 <div className="flex-1 min-w-0">
//                                                                     <div className="flex items-center gap-2 mb-2">
//                                                                         <h3 className="font-semibold text-gray-900 truncate">
//                                                                             {user.name}
//                                                                         </h3>
//                                                                         <Badge
//                                                                             variant="secondary"
//                                                                             className={cn("px-2 py-0.5 text-xs capitalize", getRoleColor(user.role))}
//                                                                         >
//                                                                             {getRoleIcon(user.role)}
//                                                                             <span className="ml-1">{user.role}</span>
//                                                                         </Badge>
//                                                                     </div>

//                                                                     <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
//                                                                         <Mail className="w-3 h-3" />
//                                                                         <span className="truncate">{user.email}</span>
//                                                                     </div>

//                                                                     <div className="flex items-center gap-1 text-xs text-gray-400">
//                                                                         <Calendar className="w-3 h-3" />
//                                                                         <span>Joined {formatDate(user.createdAt)}</span>
//                                                                     </div>

//                                                                     {user.about && (
//                                                                         <p className="text-sm text-gray-600 mt-2 overflow-hidden">
//                                                                             {user.about.length > 100 ? `${user.about.substring(0, 100)}...` : user.about}
//                                                                         </p>
//                                                                     )}
//                                                                 </div>
//                                                             </div>

//                                                             <div className="mt-4 pt-4 border-t border-gray-100">
//                                                                 <Button
//                                                                     variant="outline"
//                                                                     size="sm"
//                                                                     className="w-full hover:bg-purple-50 hover:border-purple-200"
//                                                                 >
//                                                                     View Profile
//                                                                 </Button>
//                                                             </div>
//                                                         </CardContent>
//                                                     </Card>
//                                                 </motion.div>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </motion.div>
//                     )}

//                     {/* Empty State */}
//                     {!searchQuery && (
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ duration: 0.6, delay: 0.4 }}
//                         >
//                             <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
//                                 <CardContent className="text-center py-16">
//                                     <div className="text-6xl mb-6">🔍</div>
//                                     <h3 className="text-2xl font-bold text-gray-900 mb-4">
//                                         Ready to Explore?
//                                     </h3>
//                                     <p className="text-gray-600 text-lg max-w-md mx-auto mb-8">
//                                         Use the search bar above to find users by their name or email address.
//                                         Discover teammates, competitors, and organizers in the community.
//                                     </p>
//                                     <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
//                                         <div className="flex items-center gap-2">
//                                             <Trophy className="w-4 h-4 text-blue-500" />
//                                             <span>Find Competitors</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <Users className="w-4 h-4 text-purple-500" />
//                                             <span>Connect with Organizers</span>
//                                         </div>
//                                         <div className="flex items-center gap-2">
//                                             <User className="w-4 h-4 text-green-500" />
//                                             <span>Explore Profiles</span>
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }