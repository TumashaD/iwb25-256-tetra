"use client"

import type React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CompetitionsService, type Competition } from "@/services/competitionService"
import { OrganizerService } from "@/services/organizerService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Trash2, AlertTriangle, CheckCircle, XCircle, Trophy, ImageIcon, Loader2 } from "lucide-react"
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
import { toast } from "sonner"

export default function CompetitionSettings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const competitionId = Number(params.id)

  const [competition, setCompetition] = useState<Competition | null>(null)
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    category: "",
    status: "upcoming",
    prize_pool: "",
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (competitionId) {
      fetchCompetition()
    }
  }, [user, competitionId])

  const fetchCompetition = async () => {
    try {
      setPageLoading(true)
      setError(null)
      const competition = await CompetitionsService.getCompetition(competitionId)

      if (!competition) {
        setError("Competition not found")
        return
      }

      if (competition.organizer_id !== user?.id) {
        setError("You don't have permission to edit this competition")
        return
      }

      setCompetition(competition)
      setFormData({
        title: competition.title,
        description: competition.description,
        start_date: competition.start_date.split("T")[0],
        end_date: competition.end_date.split("T")[0],
        category: competition.category,
        status: competition.status,
        prize_pool: competition.prize_pool || "",
      })
    } catch (error) {
      console.error("Failed to fetch competition:", error)
      setError("Failed to load competition details")
    } finally {
      setPageLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const updateData: Partial<Competition> = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        category: formData.category,
        status: formData.status,
        prize_pool: formData.prize_pool,
      }

      await OrganizerService.updateCompetition(competitionId, updateData)

      if (bannerFile) {
        await OrganizerService.uploadBanner(competitionId, bannerFile)
        setBannerFile(null)
        setBannerPreview(null)
      }

      setSuccess("Competition updated successfully!")
      toast.success("Competition updated successfully!")
      fetchCompetition()
    } catch (error) {
      console.error("Failed to update competition:", error)
      setError("Failed to update competition. Please try again.")
      toast.error("Failed to update competition. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      setError(null)

      await OrganizerService.deleteCompetition(competitionId)
      router.push("/dashboard/organizer")
    } catch (error) {
      console.error("Failed to delete competition:", error)
      setError("Failed to delete competition. Please try again.")
      setDeleting(false)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading Settings...</p>
        </div>
      </div>
    )
  }

  if (!user || !competition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground text-center">{error || "Competition not found or access denied"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-main">Competition Settings</h1>
            <p className="text-muted-foreground">Edit competition details and manage settings</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Competition Information
              </CardTitle>
              <CardDescription>Update basic competition details and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Competition Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prize_pool">Prize Pool</Label>
                    <Input
                      id="prize_pool"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                      placeholder="e.g., $100,000"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Competition Banner
              </CardTitle>
              <CardDescription>Upload or update the competition banner image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner">Banner Image</Label>
                <Input id="banner" type="file" accept="image/*" onChange={handleBannerChange} />
              </div>

              {bannerPreview && (
                <div className="space-y-2">
                  <Label>New Banner Preview</Label>
                  <img
                    src={bannerPreview || "/placeholder.svg"}
                    alt="Banner Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}

              {!bannerPreview && competition.banner_url && (
                <div className="space-y-2">
                  <Label>Current Banner</Label>
                  <img
                    src={
                      competition.banner_url + "?t=" + new Date(competition.updated_at).getTime() || "/placeholder.svg"
                    }
                    alt="Current Banner"
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
            
          </Card>

          

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that will permanently affect your competition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h3 className="font-semibold text-destructive">Delete Competition</h3>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete the competition and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 rounded-2xl">
                      <Trash2 className="h-4 w-4" />
                      Delete Competition
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the competition "{competition.title}"
                        and remove all associated data including enrollments, team information, and statistics.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl"
                      >
                        {deleting ? "Deleting..." : "Delete Competition"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
