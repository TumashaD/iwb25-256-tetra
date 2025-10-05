"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  TeamService,
  type Team,
  type TeamWithMembers,
  type UserSearchResult,
  type CreateTeamData,
  type AddMemberData,
} from "@/services/teamService"
import { UserService, type Profile } from "@/services/userService"
import { EnrollmentService, type EnrollmentWithDetails } from "@/services/enrollmentService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Crown, Users, Trophy, Plus, Search, Trash2, UserPlus, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AvatarImage } from "@radix-ui/react-avatar"

interface TeamMemberWithProfile {
  team_id: number
  member_id: string
  role: string
  created_at?: string
  last_modified?: string
  profile?: Profile
}

export default function CompetitorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [teamFormData, setTeamFormData] = useState<CreateTeamData>({
    name: "",
    created_by: "",
    no_participants: 1,
  })
  const [memberFormData, setMemberFormData] = useState<AddMemberData>({
    member_id: "",
    role: "member",
  })
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentUserLeader, setIsCurrentUserLeader] = useState(false)
  const [teamCreatorProfile, setTeamCreatorProfile] = useState<Profile | null>(null)
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState(false)
  const [tab, setTab] = useState("enrollments")

  // Set user ID when user is loaded
  useEffect(() => {
    if (user?.id) {
      setTeamFormData((prev) => ({ ...prev, created_by: user.id }))
    }
  }, [user?.id])

  // Fetch competitor's teams and enrollments
  useEffect(() => {
    fetchMyTeams()
    fetchMyEnrollments()
  }, [user])

  const fetchMyTeams = async () => {
    try {
      setPageLoading(true)
      setError(null)
      if (user?.id) {
        const userTeams = await TeamService.getAllUserTeams(user.id)
        setTeams(userTeams)
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      setError("Failed to fetch teams. Please try again.")
    } finally {
      setPageLoading(false)
    }
  }

  const fetchMyEnrollments = async () => {
    try {
      setError(null)
      if (user?.id) {
        const userEnrollments = await EnrollmentService.getUserEnrollments(user.id)
        setEnrollments(userEnrollments)
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error)
      setError("Failed to fetch enrollments. Please try again.")
    }
  }

  const fetchTeamDetails = async (teamId: number) => {
    try {
      const teamDetails = await TeamService.getTeam(teamId)
      setSelectedTeam(teamDetails)

      // Check if current user is a team leader (either in members list or is the creator)
      const currentUserIsLeader =
        teamDetails?.members?.some((member) => member.member_id === user?.id && member.role === "leader") ||
        teamDetails?.created_by === user?.id ||
        false

      console.log("Team details:", teamDetails)
      console.log("Current user ID:", user?.id)
      console.log("Team creator:", teamDetails?.created_by)
      console.log("Team members:", teamDetails?.members)
      console.log("Is current user leader:", currentUserIsLeader)

      setIsCurrentUserLeader(currentUserIsLeader)

      // Fetch team creator's profile
      if (teamDetails?.created_by) {
        try {
          const creatorProfile = await UserService.getUser(teamDetails.created_by)
          setTeamCreatorProfile(creatorProfile)
        } catch (error) {
          console.error("Failed to fetch team creator profile:", error)
          setTeamCreatorProfile(null)
        }
      }

      // Fetch member profiles
      if (teamDetails?.members) {
        const membersWithProfiles = await Promise.all(
          teamDetails.members.map(async (member) => {
            try {
              const profile = await UserService.getUser(member.member_id)
              return {
                ...member,
                profile: profile || undefined,
              }
            } catch (error) {
              console.error(`Failed to fetch profile for member ${member.member_id}:`, error)
              return member
            }
          }),
        )
        setTeamMembers(membersWithProfiles)
      } else {
        setTeamMembers([])
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
      setError("Failed to fetch team details.")
    }
  }

  const searchUsers = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([])
      return
    }

    try {
      const results = await TeamService.searchUsers(email)
      setSearchResults(results)
    } catch (error) {
      console.error("Failed to search users:", error)
      setSearchResults([])
    }
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setCreatingTeam(true)

      await TeamService.createTeam(teamFormData)

      // Reset form and refresh teams
      toast.success("Team created successfully!")
      resetTeamForm()
      fetchMyTeams()
      setTab("teams")
    } catch (error) {
      console.error("Failed to create team:", error)
      toast.error("Failed to create team. Please try again.")
      setError("Failed to create team. Please try again.")
    } finally {
      setCreatingTeam(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return

    try {
      setError(null)

      await TeamService.addTeamMember(selectedTeam.id, memberFormData)

      // Reset form and refresh team details
      resetMemberForm()
      fetchTeamDetails(selectedTeam.id)
    } catch (error) {
      console.error("Failed to add team member:", error)
      setError("Failed to add team member. Please try again.")
    } finally {
    }
  }

  const handleRemoveMember = async (teamId: number, memberId: string) => {
      try {
        await TeamService.removeTeamMember(teamId, memberId)
        fetchTeamDetails(teamId)
      } catch (error) {
        console.error("Failed to remove team member:", error)
        setError("Failed to remove team member. Please try again.")
      }
    
  }

  const handleDeleteTeam = async (teamId: number) => {
    setDeletingTeam(true)
    try {
      setError(null)

        await TeamService.deleteTeam(teamId)

        // Reset team selection and refresh teams list
        resetTeamSelection()
        fetchMyTeams()
        setTab("teams")
      } catch (error) {
        console.error("Failed to delete team:", error)
        setError("Failed to delete team. Please try again.")
      } finally {
        setDeletingTeam(false)
      }
    }

  const resetTeamForm = () => {
    setTeamFormData({
      name: "",
      created_by: user?.id || "",
      no_participants: 1,
    })
    setShowTeamForm(false)
  }

  const resetMemberForm = () => {
    setMemberFormData({
      member_id: "",
      role: "member",
    })
    setShowAddMemberForm(false)
    setSearchEmail("")
    setSearchResults([])
  }

  const resetTeamSelection = () => {
    setSelectedTeam(null)
    setTeamMembers([])
    setTeamCreatorProfile(null)
    setIsCurrentUserLeader(false)
  }

  const selectUserForTeam = (user: UserSearchResult) => {
    setMemberFormData((prev) => ({ ...prev, member_id: user.id }))
    setSearchEmail(user.email)
    setSearchResults([])
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-main">Competitor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your teams and track competition enrollments</p>
          </div>
          <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-pink-600 rounded-2xl hover:bg-pink-700">
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>Create a team to participate in competitions together.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    value={teamFormData.name}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Maximum Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    value={teamFormData.no_participants}
                    onChange={(e) =>
                      setTeamFormData({ ...teamFormData, no_participants: Number.parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={creatingTeam} className="flex-1">
                    {creatingTeam ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Team
                  </Button>
                  <Button type="button" variant="outline" onClick={resetTeamForm} className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue={tab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="enrollments" className="gap-2">
              <Trophy className="h-4 w-4" />
              My Enrollments
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" />
              My Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2 text-main">Competition Enrollments</h2>
              <p className="text-muted-foreground mb-6">Track all competitions you've enrolled in with your teams</p>

              {enrollments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Browse competitions and enroll your teams to get started!
                    </p>
                    <Button onClick={() => router.push("/competitions")}>Browse Competitions</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment) => (
                    <Card 
                      key={enrollment.enrollment_id} 
                      className="hover:shadow-md transition-shadow overflow-hidden relative"
                      style={{
                        backgroundImage: `url(https://icxxglazqizgjnscmdqj.supabase.co/storage/v1/object/public/competitions/${enrollment.competition_id}/banner)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      {/* Blur overlay */}
                      <div className="absolute inset-0 backdrop-blur-md bg-white/35"></div>
                      
                      {/* Status badge in corner */}
                      <div className="absolute top-3 right-3 z-20">
                        <Badge
                          variant={
                            enrollment.competition_status === "active"
                              ? "default"
                              : enrollment.competition_status === "upcoming"
                                ? "secondary"
                                : enrollment.competition_status === "completed"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {enrollment.competition_status?.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Card content */}
                      <div className="relative z-10">
                        <CardHeader className="pb-3 text-center">
                          <CardTitle className="text-2xl font-bold leading-tight text-white">{enrollment.competition_title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Transparent box for middle data */}
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-white/30">
                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-gray-700" />
                              <span className="font-medium text-base text-gray-900">{enrollment.team_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <div
                                  className={`w-3 h-3 rounded-full ${enrollment.status === "enrolled"
                                      ? "bg-green-500"
                                      : enrollment.status === "pending"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                />
                                <span className="text-base font-medium text-gray-900">
                                  {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                </span>
                              </div>
                            </div>

                            {enrollment.competition_start_date && (
                              <div className="flex items-center gap-2 text-base text-gray-700">
                                <CalendarDays className="h-5 w-5" />
                                <span>
                                  {new Date(enrollment.competition_start_date).toLocaleDateString()} -{" "}
                                  {enrollment.competition_end_date
                                    ? new Date(enrollment.competition_end_date).toLocaleDateString()
                                    : "TBD"}
                                </span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/50 backdrop-blur-sm border-gray-300 text-gray-900 hover:bg-white/70"
                            onClick={() => router.push(`/competitions/${enrollment.competition_id}`)}
                          >
                            View Competition
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Teams List */}
              <div>
                <h2 className="text-2xl font-semibold mb-2">My Teams</h2>
                <p className="text-muted-foreground mb-6">Teams where you are either the creator or a member</p>

                {teams.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                      <p className="text-muted-foreground text-center">
                        Create your first team or get added to an existing team!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <Card
                      key={team.id}
                      className={`cursor-pointer transition-all hover:shadow-md flex flex-col overflow-hidden p-0 min-h-[280px] sm:min-h-[320px] lg:min-h-[280px] ${selectedTeam?.id === team.id ? "ring-2 ring-primary" : ""
                        }`}
                      onClick={() => fetchTeamDetails(team.id)}
                      >
                      {/* Top Section - Team Name */}
                      <div className="flex-shrink-0 text-center border-b flex items-center justify-center bg-main/10 min-h-[80px] sm:min-h-[100px]">
                        <h3 className="font-bold text-lg sm:text-xl text-center text-main break-words hyphens-auto">{team.name}</h3>
                      </div>
                      
                      {/* Middle Section - Participant Data and Date */}
                      <div className="flex-1 bg-white text-center flex flex-col justify-center space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">Max {team.no_participants} participants</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                        <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">
                          Created {team.created_at ? new Date(team.created_at).toLocaleDateString() : "N/A"}
                        </span>
                        </div>
                      </div>
                      
                      {/* Bottom Section - Role Badge */}
                      <div className={`flex-shrink-0 p-0 text-center flex items-center justify-center rounded-b-lg min-h-[40px] sm:min-h-[50px] ${team.created_by === user?.id ? "bg-amber-400" : "bg-gray-400"}`}>
                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-white font-semibold text-sm sm:text-base">
                        {team.created_by === user?.id ? (
                          <>
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span>Creator</span>
                          </>
                        ) : (
                          <>
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          <span>Member</span>
                          </>
                        )}
                        </div>
                      </div>
                      </Card>
                    ))}
                    </div>
                )}
              </div>

              {/* Team Details */}
              <div>
                <h2 className="text-2xl font-semibold mb-2">Team Details</h2>
                <p className="text-muted-foreground mb-6">Select a team to view and manage details</p>

                {selectedTeam ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{selectedTeam.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {teamMembers.length} of {selectedTeam.no_participants} members
                          </CardDescription>
                        </div>
                        {isCurrentUserLeader && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingTeam}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your
                                  team and remove your data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeam(selectedTeam.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Max Participants:</span>
                          <p className="font-medium">{selectedTeam.no_participants}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Members:</span>
                          <p className="font-medium">{teamMembers.length}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Team Members Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team Members
                          </h4>
                          {isCurrentUserLeader && (
                            <Dialog open={showAddMemberForm} onOpenChange={setShowAddMemberForm}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add Member
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Team Member</DialogTitle>
                                  <DialogDescription>
                                    Search for a user by email to add them to your team.
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="memberEmail">Member Email</Label>
                                    <div className="relative">
                                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        id="memberEmail"
                                        type="email"
                                        placeholder="Search by email..."
                                        value={searchEmail}
                                        onChange={(e) => {
                                          setSearchEmail(e.target.value)
                                          searchUsers(e.target.value)
                                        }}
                                        className="pl-10"
                                      />
                                      {searchResults.length > 0 && (
                                        <Card className="absolute top-full left-0 right-0 mt-1 z-10 max-h-48 overflow-y-auto">
                                          <CardContent className="p-0">
                                            {searchResults.map((user) => (
                                              <div
                                                key={user.id}
                                                onClick={() => selectUserForTeam(user)}
                                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                                              >
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                              </div>
                                            ))}
                                          </CardContent>
                                        </Card>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      type="submit"
                                      disabled={loading || !memberFormData.member_id}
                                      className="flex-1"
                                    >
                                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                      Add Member
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={resetMemberForm}
                                      className="flex-1 bg-transparent"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Team Creator */}
                          {selectedTeam.created_by && teamCreatorProfile && (
                            <Card className="border-primary/20 bg-primary/5">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={teamCreatorProfile.avatar_url || "/placeholder.svg"} alt={teamCreatorProfile.name} />
                                    </Avatar>
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {teamCreatorProfile.name}
                                        <Badge variant="default" className="text-xs bg-amber-400">
                                          <Crown className="h-3 w-3 mr-1" />
                                          Creator
                                        </Badge>
                                      </div>
                                      <div className="text-sm text-muted-foreground">{teamCreatorProfile.email}</div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Other Members */}
                          {teamMembers
                            .filter((member) => member.member_id !== selectedTeam.created_by)
                            .map((member) => (
                              <Card key={member.member_id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar>
                                        <AvatarImage src={member.profile?.avatar_url || "/placeholder.svg"} alt={member.profile?.name || "User Avatar"} />
                                        <AvatarFallback>U</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">{member.profile?.name || "Unknown User"}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {member.profile?.email || member.member_id}
                                        </div>
                                        <Badge variant="outline" className="text-xs mt-1">
                                          {member.role === "leader" ? "Team Leader" : "Member"}
                                        </Badge>
                                      </div>
                                    </div>
                                    {isCurrentUserLeader && (
                                      <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                        variant="destructive"
                                        size="sm"
                                      >
                                        Remove
                                      </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your
                                  team and remove your data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(selectedTeam.id, member.member_id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                                      
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}

                          {teamMembers.filter((member) => member.member_id !== selectedTeam.created_by).length === 0 &&
                            teamCreatorProfile && (
                              <p className="text-muted-foreground text-sm text-center py-4">
                                No additional members yet. Add some members to get started!
                              </p>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a team</h3>
                      <p className="text-muted-foreground text-center">
                        Choose a team from the list to view and manage its details
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
