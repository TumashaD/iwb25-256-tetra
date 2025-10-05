"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, FileText, Calendar, User, Eye, Download } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { EventService, type Event, type Submission } from "@/services/eventService"

export default function EventSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const competitionId = parseInt(params.id as string)
  const eventId = parseInt(params.eventId as string)

  const [event, setEvent] = useState<Event | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false)

  // Load event and submissions from backend
  useEffect(() => {
    const loadEventAndSubmissions = async () => {
      try {
        setLoading(true)
        
        // Load event details
        const eventData = await EventService.getEvent(competitionId, eventId)
        setEvent(eventData)
        
        // Load submissions for this event
        const submissionsData = await EventService.getEventSubmissions(eventId)
        setSubmissions(submissionsData)
        
      } catch (error) {
        console.error("Error loading event and submissions:", error)
        toast.error("Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    if (competitionId && eventId && user) {
      loadEventAndSubmissions()
    }
  }, [competitionId, eventId, user])

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowSubmissionDetails(true)
  }

  const handleDownloadSubmissions = () => {
    // Create a JSON file with all submissions
    const dataStr = JSON.stringify(submissions, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${event?.title || 'event'}_submissions.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success("Submissions downloaded successfully!")
  }

  const renderSubmissionValue = (value: any): string => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2)
    return String(value)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading submissions...
      </div>
    )
  }

  if (showSubmissionDetails && selectedSubmission) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowSubmissionDetails(false)
              setSelectedSubmission(null)
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Submission Details</h1>
            <p className="text-muted-foreground">
              Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submission Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeof selectedSubmission.submission === 'object' && selectedSubmission.submission !== null ? (
              Object.entries(selectedSubmission.submission as Record<string, any>).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {renderSubmissionValue(value)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm">
                {renderSubmissionValue(selectedSubmission.submission)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/organizer/competition/${competitionId}/events`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event?.title} - Submissions</h1>
            <p className="text-muted-foreground">
              View and manage all submissions for this event
            </p>
          </div>
        </div>

        {submissions.length > 0 && (
          <Button 
            onClick={handleDownloadSubmissions}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download All
          </Button>
        )}
      </div>

      {event && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{event.title}</p>
              </div>
              {event.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{event.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(event.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
            <p className="text-muted-foreground">
              Participants haven't submitted any responses for this event yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Submissions ({submissions.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Submission #{submission.id}
                        <Badge variant="outline">
                          Enrollment #{submission.enrollment_id}
                        </Badge>
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(submission.created_at).toLocaleString()}
                      {submission.modified_at !== submission.created_at && (
                        <span className="ml-2">
                          • Last modified: {new Date(submission.modified_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewSubmission(submission)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}