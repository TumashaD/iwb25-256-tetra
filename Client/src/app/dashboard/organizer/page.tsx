"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { CompetitionsService, type Competition } from "@/services/competitionService"
import { EnrollmentService, type EnrollmentWithDetails } from "@/services/enrollmentService"
import { OrganizerService } from "@/services/organizerService"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Users,
  Trophy,
  Plus,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { CompetitionCard } from "@/components/competition-card"

export default function OrganizerDashboard() {
  const { user, loading } = useAuth()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAllCompetitions, setShowAllCompetitions] = useState(false)
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: "",
    description: "",
    prize_pool: "",
    organizer_id: "",
    start_date: "",
    end_date: "",
    category: "",
    status: "upcoming",
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setPageLoading(true)
      setError(null)
      let competitionId: number | null = null
        const created = await OrganizerService.createCompetition(formData)
        competitionId = created?.id
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      prize_pool: "",
      organizer_id: user?.id || "",
      start_date: "",
      end_date: "",
      category: "",
      status: "upcoming",
    })
    setShowCreateForm(false)
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

  const getDisplayedCompetitions = () => {
    if (showAllCompetitions || competitions.length <= 6) {
      return competitions
    }
    return competitions.slice(0, 6)
  }

  const stats = getStatistics()
  const displayedCompetitions = getDisplayedCompetitions()
  const hasMoreCompetitions = competitions.length > 6

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
      {/* Header Section - White Background */}
      <div className="bg-background">
        <div className="container mx-auto px-4 pt-24 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-main">Organizer Dashboard</h1>
              <p className="text-muted-foreground mt-2">Create | Manage | View | competitions</p>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 bg-pink-600 rounded-2xl hover:bg-pink-700">
                  <Plus className="h-4 w-4" />
                  New Competition
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{"Create New Competition"}</DialogTitle>
                <DialogDescription>
                  {"Fill in the details to create a new competition"}
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
                      placeholder="e.g., IoT, AI, Blockchain,"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prize_pool">Prize Pool</Label>
                    <Input
                      id="prize_pool"
                      placeholder="Enter competition prize pool"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
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
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : "Create Competition"}
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
        </div>
      </div>

      {/* My Competitions Section with Gray Background */}
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* My Competitions */}
          <div className="mb-8 flex flex-col gap-1">
            <h2 className="text-2xl font-semibold mb-2 text-main">My Competitions</h2>
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
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {displayedCompetitions.map((competition) => (
                  <CompetitionCard competition={competition} key={competition.id} userType="organizer"/>
                ))}
              </div>
              
              {!showAllCompetitions && hasMoreCompetitions && (
                <div className="text-center -mt-8 mb-12">
                  <Button 
                    onClick={() => setShowAllCompetitions(true)}
                    variant="outline" 
                    size="lg"
                    className="bg-background/80 backdrop-blur-sm border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl"
                  >
                    Show All Competitions ({competitions.length})
                  </Button>
                </div>
              )}

              {showAllCompetitions && hasMoreCompetitions && (
                <div className="text-center -mt-8 mb-12">
                  <Button 
                    onClick={() => setShowAllCompetitions(false)}
                    variant="outline" 
                    size="lg"
                    className="bg-background/80 backdrop-blur-sm border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl"
                  >
                    Show Less
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
