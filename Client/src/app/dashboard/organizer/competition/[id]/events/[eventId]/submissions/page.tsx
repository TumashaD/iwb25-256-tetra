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
import { SubmissionView } from "@/components/forms/FormDisplay"

export default function EventSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const competitionId = parseInt(params.id as string)
  const eventId = parseInt(params.eventId as string)

  const [event, setEvent] = useState<Event | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false)

  // Helper function to extract clean form data from submission
  const getCleanSubmissionData = (submission: any) => {
    if (!submission) return null

    let submissionData = submission
    
    // If submission is a string, parse it
    if (typeof submissionData === 'string') {
      try {
        submissionData = JSON.parse(submissionData)
      } catch (error) {
        console.error('Failed to parse submission data:', error)
        return null
      }
    }
    
    // Check if the submission data has a nested 'submission' field that contains the actual form data
    if (submissionData && typeof submissionData === 'object' && submissionData.submission) {
      // If it's a nested structure like {event_id: 7, enrollment_id: 31, submission: {actual_form_data}}
      if (typeof submissionData.submission === 'object') {
        submissionData = submissionData.submission
      } else if (typeof submissionData.submission === 'string') {
        try {
          submissionData = JSON.parse(submissionData.submission)
        } catch (error) {
          console.error('Failed to parse nested submission string:', error)
        }
      }
    }
    
    // Remove metadata fields if they exist
    if (submissionData && typeof submissionData === 'object') {
      const { event_id, enrollment_id, submission, ...formData } = submissionData
      if (Object.keys(formData).length > 0) {
        submissionData = formData
      }
    }
    
    return submissionData
  }

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
        console.log('Organizer submissions data:', submissionsData)
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

  const handleSelectSubmission = (submissionId: number) => {
    setSelectedSubmissions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId)
      } else {
        newSet.add(submissionId)
      }
      return newSet
    })
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
        </div>

        {event && selectedSubmission && (
          <>
            {(() => {
              const cleanedData = getCleanSubmissionData(selectedSubmission.submission)
              console.log('Cleaned submission data for organizer:', cleanedData)
              
              return (
                <SubmissionView
                  formSchema={event.form_schema}
                  submissionData={cleanedData}
                  eventData={event}
                  existingSubmission={selectedSubmission}
                  title={`${event.title} - Submission Details`}
                />
              )
            })()}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-main">Submissions</h1>
          <p className="text-muted-foreground">
            View and manage all submissions for this event
          </p>
        </div>
      </div>

      {/* Event Details and Statistics Row */}
      {event && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Information - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-main">
                  <FileText className="h-6 w-6" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-700">{event.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Statistics - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-main">
                  <User className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-black">{submissions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected Submissions</p>
                    <p className="text-2xl font-bold text-green-600">{selectedSubmissions.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
            {submissions.length > 0 && (
              <Button 
                onClick={handleDownloadSubmissions}
                className="gap-2 bg-pink-600 rounded-2xl hover:bg-pink-700"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            )}
          </div>
          
          <div className="grid gap-4">
            {submissions.map((submission, index) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">Submission {index + 1}</h3>
                        <p className="text-sm text-muted-foreground">
                          Enrollment #{submission.enrollment_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={selectedSubmissions.has(submission.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectSubmission(submission.id)}
                        className={`flex items-center gap-1 min-w-[80px] ${selectedSubmissions.has(submission.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {selectedSubmissions.has(submission.id) ? 'Selected' : 'Select'}
                      </Button>
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