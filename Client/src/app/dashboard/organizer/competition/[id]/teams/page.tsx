"use client"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CompetitionsService, type Competition } from "@/services/competitionService"
import { EnrollmentService, type EnrollmentWithDetails } from "@/services/enrollmentService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Search,
  Filter,
  Mail,
  Send,
  Trophy,
  Calendar,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react"
import { EnrollmentTeamMember } from "@/services/enrollmentService"
import { MailService } from "@/services/mailService"

interface EnrolledTeams extends EnrollmentWithDetails {
  members?: EnrollmentTeamMember[]
}

const statusOptions = [
  { value: "registered", label: "Registered", color: "bg-blue-500" },
  { value: "qualified", label: "Qualified", color: "bg-green-500" },
  { value: "round-1", label: "Round 1", color: "bg-yellow-500" },
  { value: "round-2", label: "Round 2", color: "bg-orange-500" },
  { value: "semi-finals", label: "Semi Finals", color: "bg-purple-500" },
  { value: "finals", label: "Finals", color: "bg-red-500" },
  { value: "winner", label: "Winner", color: "bg-gold-500" },
  { value: "eliminated", label: "Eliminated", color: "bg-gray-500" },
]

export default function TeamManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const competitionId = Number(params.id)

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [teams, setTeams] = useState<EnrolledTeams[]>([])
  const [filteredTeams, setFilteredTeams] = useState<EnrolledTeams[]>([])
  const [selectedTeam, setSelectedTeam] = useState<EnrolledTeams | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set())
  const [showTeamDetails, setShowTeamDetails] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [emailTarget, setEmailTarget] = useState<"all" | "selected" | "filtered">("all")
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && competitionId) {
      fetchCompetitionData()
      fetchTeams()
    }
  }, [user, competitionId])

  useEffect(() => {
    filterTeams()
  }, [teams, searchQuery, statusFilter])

  const fetchCompetitionData = async () => {
    try {
      const competition = await CompetitionsService.getCompetition(competitionId)
      if (competition && competition.organizer_id === user?.id) {
        setCompetition(competition)
      } else {
        router.push("/organizer/dashboard")
      }
    } catch (error) {
      console.error("Failed to fetch competition:", error)
      setError("Failed to fetch competition data")
    }
  }

  const handleDeleteTeam = async (enrollmentId: number) => {
    try {
      setPageLoading(true)
      await EnrollmentService.deleteEnrollment(enrollmentId)
      setTeams((prev) => prev.filter((team) => team.enrollment_id !== enrollmentId))
    } catch (error) {
      console.error("Failed to delete team:", error)
      setError("Failed to delete team")
    } finally {
      setPageLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      setPageLoading(true)
      const enrollments = await EnrollmentService.getCompetitionEnrollments(competitionId)
      const teamsWithMembers: EnrolledTeams[] = await Promise.all(
        enrollments.map(async (enrollment) => {
          const members = await EnrollmentService.getEnrollmentTeamMembers(enrollment.enrollment_id)
          return { ...enrollment, members }
        }),
      )

      setTeams(teamsWithMembers)
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      setError("Failed to fetch teams")
    } finally {
      setPageLoading(false)
    }
  }

  const filterTeams = () => {
    let filtered = teams

    if (searchQuery) {
      filtered = filtered.filter((team) => team.team_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((team) => team.status === statusFilter)
    }

    setFilteredTeams(filtered)
  }

  const updateTeamStatus = async (teamId: number, newStatus: string) => {
    try {
      await EnrollmentService.updateEnrollmentStatus(teamId, newStatus)
      setTeams((prev) =>
        prev.map((team) => (team.enrollment_id === teamId ? { ...team, status: newStatus } : team)),
      )
    } catch (error) {
      console.error("Failed to update team status:", error)
      setError("Failed to update team status")
    }
  }

  const handleTeamSelection = (teamId: number, checked: boolean) => {
    const newSelected = new Set(selectedTeams)
    if (checked) {
      newSelected.add(teamId)
    } else {
      newSelected.delete(teamId)
    }
    setSelectedTeams(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeams(new Set(filteredTeams.map((team) => team.enrollment_id)))
    } else {
      setSelectedTeams(new Set())
    }
  }

  const sendEmail = async () => {
    try {
      let targetTeams: EnrolledTeams[] = []

      switch (emailTarget) {
        case "all":
          targetTeams = teams
          break
        case "selected":
          targetTeams = teams.filter((team) => selectedTeams.has(team.enrollment_id))
          break
        case "filtered":
          targetTeams = filteredTeams
          break
      }

      // In real app, this would send emails via API
      await Promise.all(
        targetTeams.map((team) =>
          MailService.sendMail({
            sender: user?.email ? user.email : "",
            recipients: team.members ? team.members.map((member) => member.email) : [],
            subject: emailSubject,
            body: emailMessage,
          })
        )
      )
      console.log(
        "Sending email to teams:",
        targetTeams.map((t) => t.team_name),
      )
      console.log("Subject:", emailSubject)
      console.log("Message:", emailMessage)

      setShowEmailModal(false)
      setEmailSubject("")
      setEmailMessage("")
      alert(`Email sent to ${targetTeams.length} teams successfully!`)
    } catch (error) {
      console.error("Failed to send email:", error)
      setError("Failed to send email")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((opt) => opt.value === status)
    if (!statusOption) return null

    return <Badge className={`${statusOption.color} text-white`}>{statusOption.label}</Badge>
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading team management...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !competition) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">{competition.title}</p>
          </div>
        </div>

        {/* Competition Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {competition.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(competition.start_date).toLocaleDateString()} -{" "}
                    {new Date(competition.end_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {teams.length} Teams Enrolled
                  </span>
                </CardDescription>
              </div>
              <Badge variant={competition.status === "active" ? "default" : "secondary"}>
                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send Email to Teams</DialogTitle>
                    <DialogDescription>Send notifications or updates to your teams</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Target</Label>
                      <Select value={emailTarget} onValueChange={(value: any) => setEmailTarget(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Teams ({teams.length})</SelectItem>
                          <SelectItem value="selected">Selected Teams ({selectedTeams.size})</SelectItem>
                          <SelectItem value="filtered">Filtered Teams ({filteredTeams.length})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input
                        id="email-subject"
                        placeholder="Email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-message">Message</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Your message to teams..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={sendEmail} disabled={!emailSubject || !emailMessage} className="flex-1">
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" onClick={() => setShowEmailModal(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Teams Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Teams ({filteredTeams.length})</CardTitle>
              {filteredTeams.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedTeams.size === filteredTeams.length} onCheckedChange={handleSelectAll} />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No teams found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No teams have enrolled in this competition yet"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Competition Status</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.enrollment_id} onClick={() => {
                      setSelectedTeam(team)
                      setShowTeamDetails(true)
                    }} className="cursor-pointer">
                      <TableCell>
                        <Checkbox
                          checked={selectedTeams.has(team.enrollment_id)}
                          onCheckedChange={(checked) => handleTeamSelection(team.enrollment_id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>
                        <Select
                          value={team.status || "registered"}
                          onValueChange={(value) => updateTeamStatus(team.enrollment_id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{team.created_at ? new Date(team.created_at).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {team.members?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Delete Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTeam(team.enrollment_id)
                          }}
                          className="gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Team Details Modal */}
        <Dialog open={showTeamDetails} onOpenChange={setShowTeamDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {selectedTeam?.team_name}
              </DialogTitle>
              <DialogDescription>Team details and member information</DialogDescription>
            </DialogHeader>

            {selectedTeam && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Competition Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTeam.status || "registered")}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Enrolled Date</Label>
                  <p className="mt-1">
                    {selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleString() : "N/A"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Team Members</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTeam.members?.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            <Badge variant="outline">{member.role}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )) || <p className="text-muted-foreground">No member information available</p>}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
