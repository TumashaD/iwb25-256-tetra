"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CompetitionsService, type Competition } from "@/services/competitionService"
import { EnrollmentService, type EnrollmentWithDetails } from "@/services/enrollmentService"
import { OrganizerService } from "@/services/organizerService"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  CalendarDays,
  Users,
  Trophy,
  Plus,
  Trash2,
  Eye,
  Check,
  X,
  AlertCircle,
  Settings,
  Globe,
  UserCheck,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { CompetitionCard } from "@/components/competition-card"

export default function OrganizerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [competitionEnrollments, setCompetitionEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: "",
    description: "",
    organizer_id: "",
    start_date: "",
    end_date: "",
    category: "",
    status: "upcoming",
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedBanners, setUploadedBanners] = useState<Record<number, string>>({})

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, organizer_id: user.id }))
    }
  }, [user?.id])

  useEffect(() => {
      fetchMyCompetitions()
  }, [user])

  const fetchMyCompetitions = async () => {
    try {
      setPageLoading(true)
      setError(null)
      const allCompetitions = await CompetitionsService.getCompetitions()
      const myCompetitions = allCompetitions.filter((comp) => comp.organizer_id === user?.id)
      setCompetitions(myCompetitions)
    } catch (error) {
      console.error("Failed to fetch competitions:", error)
      setError("Failed to fetch competitions. Please try again.")
    } finally {
      setPageLoading(false)
    }
  }

  const fetchCompetitionEnrollments = async (competition: Competition) => {
    try {
      setSelectedCompetition(competition)
      setError(null)
      const enrollments = await EnrollmentService.getCompetitionEnrollments(competition.id)
      setCompetitionEnrollments(enrollments)
      setShowEnrollmentModal(true)
    } catch (error) {
      console.error("Failed to fetch competition enrollments:", error)
      setError("Failed to fetch enrollments. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setPageLoading(true)
      setError(null)
      let competitionId: number | null = null
      if (editingCompetition) {
        const updateData: Partial<Competition> = {
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          category: formData.category,
          status: formData.status,
        }
        await OrganizerService.updateCompetition(editingCompetition.id, updateData)
        competitionId = editingCompetition.id
      } else {
        const created = await OrganizerService.createCompetition(formData)
        competitionId = created?.id
      }
      if (bannerFile && competitionId) {
        await OrganizerService.uploadBanner(competitionId, bannerFile)
      }
      resetForm()
      fetchMyCompetitions()
    } catch (error) {
      console.error("Failed to save competition:", error)
      setError("Failed to save competition. Please try again.")
    } finally {
      setPageLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this competition?")) {
      try {
        await OrganizerService.deleteCompetition(id)
        fetchMyCompetitions()
      } catch (error) {
        console.error("Failed to delete competition:", error)
        alert("Failed to delete competition. Please try again.")
      }
    }
  }

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition)
    setFormData({
      title: competition.title,
      description: competition.description,
      organizer_id: competition.organizer_id,
      start_date: competition.start_date.split("T")[0],
      end_date: competition.end_date.split("T")[0],
      category: competition.category,
      status: competition.status,
    })
    setBannerFile(null)
    setShowCreateForm(true)
  }

  const handleBannerUpload = async (competitionId: number, file: File) => {
    try {
      setUploading(competitionId)
      setUploadedBanners((prev) => ({ ...prev, [competitionId]: URL.createObjectURL(file) }))
      await OrganizerService.uploadBanner(competitionId, file)
      fetchMyCompetitions()
      alert("Banner uploaded successfully!")
    } catch (error) {
      console.error("Failed to upload banner:", error)
      alert("Failed to upload banner. Please try again.")
      setUploadedBanners((prev) => {
        const newState = { ...prev }
        delete newState[competitionId]
        return newState
      })
    } finally {
      setUploading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      organizer_id: user?.id || "",
      start_date: "",
      end_date: "",
      category: "",
      status: "upcoming",
    })
    setShowCreateForm(false)
    setEditingCompetition(null)
    setBannerFile(null)
  }

  const getStatistics = () => {
    const totalCompetitions = competitions.length
    const activeCompetitions = competitions.filter((c) => c.status === "active").length
    const upcomingCompetitions = competitions.filter((c) => c.status === "upcoming").length
    const completedCompetitions = competitions.filter((c) => c.status === "completed").length
    const totalTeams = competitions.reduce((sum, comp) => sum + (comp.teams || 0), 0)

    return {
      totalCompetitions,
      activeCompetitions,
      upcomingCompetitions,
      completedCompetitions,
      totalTeams,
    }
  }

  const stats = getStatistics()

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Organizer Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your competitions and enrollments</p>
          </div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                New Competition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCompetition ? "Edit Competition" : "Create New Competition"}</DialogTitle>
                <DialogDescription>
                  {editingCompetition
                    ? "Update your competition details"
                    : "Fill in the details to create a new competition"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Competition Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter competition title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., FPS, MOBA, Battle Royale"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your competition..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as "upcoming" | "active" | "completed" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Competition Banner</Label>
                  <Input
                    id="banner"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setBannerFile(file || null)
                    }}
                  />
                  {bannerFile && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(bannerFile) || "/placeholder.svg"}
                        alt="Banner Preview"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  {!bannerFile && editingCompetition && editingCompetition.banner_url && (
                    <div className="mt-2">
                      <img
                        src={
                          editingCompetition.banner_url + "?t=" + new Date(editingCompetition.updated_at).getTime() ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Current Banner"
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          ; (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : editingCompetition ? "Update Competition" : "Create Competition"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 bg-transparent"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Competitions</p>
                  <p className="text-2xl font-bold">{stats.totalCompetitions}</p>
                </div>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeCompetitions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.upcomingCompetitions}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.completedCompetitions}</p>
                </div>
                <Check className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{stats.totalTeams}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* My Competitions */}
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-3xl font-semibold">My Competitions</h2>
          <span className="text-lg text-muted-foreground">
            Manage your competitions and track their progress
          </span>

        </div>
        {competitions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="mb-2">No competitions yet</CardTitle>
              <CardDescription className="mb-4">Create your first competition to get started</CardDescription>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Competition
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {competitions.map((competition) => (
              <CompetitionCard competition={competition} key={competition.id} userType="organizer"/>
            ))}
          </div>
        )}

        {/* <Dialog open={showEnrollmentModal} onOpenChange={setShowEnrollmentModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Enrollments for "{selectedCompetition?.title}"</DialogTitle>
              <DialogDescription>Manage team enrollments and approvals</DialogDescription>
            </DialogHeader>

            {competitionEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
                <p className="text-muted-foreground">Teams haven't enrolled in this competition yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Enrollments: {competitionEnrollments.length}</p>
                </div>

                <div className="space-y-3">
                  {competitionEnrollments.map((enrollment) => (
                    <Card key={enrollment.enrollment_id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{enrollment.team_name}</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge
                                  variant={
                                    enrollment.status === "enrolled"
                                      ? "default"
                                      : enrollment.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {enrollment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await EnrollmentService.updateEnrollmentStatus(
                                        enrollment.enrollment_id,
                                        "enrolled",
                                      )
                                      fetchCompetitionEnrollments(selectedCompetition!)
                                    } catch (error) {
                                      console.error("Failed to approve enrollment:", error)
                                      setError("Failed to approve enrollment")
                                    }
                                  }}
                                  className="gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    try {
                                      await EnrollmentService.updateEnrollmentStatus(
                                        enrollment.enrollment_id,
                                        "rejected",
                                      )
                                      fetchCompetitionEnrollments(selectedCompetition!)
                                    } catch (error) {
                                      console.error("Failed to reject enrollment:", error)
                                      setError("Failed to reject enrollment")
                                    }
                                  }}
                                  className="gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm("Are you sure you want to remove this enrollment?")) {
                                  try {
                                    await EnrollmentService.deleteEnrollment(enrollment.enrollment_id)
                                    fetchCompetitionEnrollments(selectedCompetition!)
                                  } catch (error) {
                                    console.error("Failed to delete enrollment:", error)
                                    setError("Failed to delete enrollment")
                                  }
                                }
                              }}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog> */}
      </div>
    </div>
  )
}
