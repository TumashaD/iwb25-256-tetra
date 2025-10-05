"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Calendar, Eye, Edit, Trash2, CheckCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import FormDisplay from "@/components/forms/FormDisplay"
import { useAuth } from "@/contexts/AuthContext"
import { EventService, type Event, type Submission } from "@/services/eventService"
import { EnrollmentService } from "@/services/enrollmentService"

export default function CompetitorDashboardEventsPage() {
  const params = useParams()
  const { user } = useAuth()
  const competitionId = parseInt(params.id as string)

  const [events, setEvents] = useState<Event[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null)

  // Load events and user submissions from backend
  useEffect(() => {
    const loadEventsAndSubmissions = async () => {
      try {
        setLoading(true)
        
        if (!user?.id) return
        
        // Get enrollment ID for submissions (user is enrolled if they can access this page)
        const enrollmentStatus = await EnrollmentService.isUserEnrolledInCompetition(user.id, competitionId)
        
        if (!enrollmentStatus.enrollmentId) {
          // Fallback: try to get all user enrollments and find this competition
          const allEnrollments = await EnrollmentService.getUserEnrollments(user.id)
          const matchingEnrollment = allEnrollments.find(e => e.competition_id === competitionId)
          if (matchingEnrollment) {
            setEnrollmentId(matchingEnrollment.enrollment_id)
          } else {
            toast.error('Enrollment not found. Please contact support.')
            return
          }
        } else {
          setEnrollmentId(enrollmentStatus.enrollmentId)
        }
        
        // Load events for this competition
        const eventsData = await EventService.getEvents(competitionId)
        setEvents(eventsData)
        
        // Load user's submissions for this competition after we have enrollment ID
        // We'll load submissions in a separate effect after enrollmentId is set
        
      } catch (error) {
        console.error("Error loading events and submissions:", error)
        toast.error("Failed to load events")
      } finally {
        setLoading(false)
      }
    }

    if (competitionId && user) {
      loadEventsAndSubmissions()
    }
  }, [competitionId, user])

  // Separate effect to load submissions once we have enrollment ID
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!enrollmentId) return
      
      try {
        const userSubmissions = await EventService.getUserSubmissions(competitionId, enrollmentId)
        setSubmissions(userSubmissions)
      } catch (error) {
        console.error("Error loading submissions:", error)
        toast.error("Failed to load submissions")
      }
    }

    loadSubmissions()
  }, [enrollmentId, competitionId])

  const getUserSubmission = (eventId: number) => {
    return submissions.find(sub => sub.event_id === eventId)
  }

  const handleViewSubmission = (event: Event) => {
    const submission = getUserSubmission(event.id)
    console.log('handleViewSubmission Debug:', {
      eventId: event.id,
      submission,
      allSubmissions: submissions
    })
    if (submission) {
      setSelectedEvent(event)
      setIsEditing(false) // View mode
      setShowForm(true)
    }
  }

  const handleEditSubmission = (event: Event) => {
    const submission = getUserSubmission(event.id)
    console.log('handleEditSubmission Debug:', {
      eventId: event.id,
      submission,
      allSubmissions: submissions
    })
    setSelectedEvent(event)
    setIsEditing(true) // Edit mode
    setShowForm(true)
  }

  const handleDeleteSubmission = async (eventId: number) => {
    try {
      const submission = getUserSubmission(eventId)
      if (!submission) {
        toast.error("No submission found to delete")
        return
      }

      // Delete from backend
      await EventService.deleteSubmission(competitionId, submission.id)
      
      // Remove from local state
      setSubmissions(prev => prev.filter(sub => sub.event_id !== eventId))
      toast.success("Submission deleted successfully!")
    } catch (error) {
      console.error("Error deleting submission:", error)
      toast.error("Failed to delete submission")
    }
  }

  const handleSubmitForm = async (submissionData: any) => {
    try {
      if (!selectedEvent || !enrollmentId) {
        toast.error("You must be enrolled to submit")
        return
      }

      const existingSubmission = getUserSubmission(selectedEvent.id)
      
      if (existingSubmission && isEditing) {
        // Update existing submission
        await EventService.updateSubmission(competitionId, existingSubmission.id, submissionData)
        
        // Update local state
        setSubmissions(prev => 
          prev.map(sub => 
            sub.id === existingSubmission.id 
              ? { ...sub, submission: submissionData, modified_at: new Date().toISOString() }
              : sub
          )
        )
        
        toast.success("Submission updated successfully!")
      } else {
        // Create new submission
        const newSubmission = await EventService.submitForm(competitionId, {
          event_id: selectedEvent.id,
          enrollment_id: enrollmentId,
          submission: submissionData
        })
        
        setSubmissions(prev => {
          // Remove existing submission for this event and add the new one
          const filtered = prev.filter(sub => sub.event_id !== selectedEvent.id)
          return [...filtered, newSubmission]
        })
        
        toast.success("Submission saved successfully!")
      }
      
      setShowForm(false)
      setSelectedEvent(null)
      setIsEditing(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit form")
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading events...
      </div>
    )
  }

  if (showForm && selectedEvent) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setSelectedEvent(null)
              setIsEditing(false)
            }}
          >
            ← Back to Events
          </Button>
        </div>
        
        <FormDisplay
          eventId={selectedEvent.id}
          eventData={selectedEvent}
          enrollmentId={enrollmentId || undefined}
          onSubmit={handleSubmitForm}
          existingSubmission={getUserSubmission(selectedEvent.id)}
          editMode={isEditing}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-muted-foreground">
            Participate in competition events and submit your work
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enrolled
        </Badge>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Available Events</h3>
            <p className="text-muted-foreground mb-4">
              The organizers haven't created any events for this competition yet.
            </p>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Events will appear here when:</span>
              </div>
              <ul className="text-left space-y-1">
                <li>• Organizers create submission forms</li>
                <li>• Tasks and challenges are published</li>
                <li>• Feedback collection opens</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const userSubmission = getUserSubmission(event.id)

            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {event.title}
                        {userSubmission && (
                          <Badge className="bg-green-100 text-green-800 ml-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        )}
                      </CardTitle>
                      {event.description && (
                        <p className="text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(event.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {userSubmission ? (
                        <>Last updated: {new Date(userSubmission.modified_at).toLocaleDateString()}</>
                      ) : (
                        <>Available since: {new Date(event.created_at).toLocaleDateString()}</>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {userSubmission ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewSubmission(event)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View Submission
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditSubmission(event)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSubmission(event.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => handleEditSubmission(event)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}