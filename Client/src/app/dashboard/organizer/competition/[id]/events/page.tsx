"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, FileText, Calendar, Edit, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import FormBuilder from "@/components/forms/FormBuilder"
import { useAuth } from "@/contexts/AuthContext"
import { EventService, type Event } from "@/services/eventService"

export default function OrganizerEventsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const competitionId = parseInt(params.id as string)

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormBuilder, setShowFormBuilder] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Load events from backend
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const eventsData = await EventService.getEvents(competitionId)
        setEvents(eventsData)
      } catch (error) {
        console.error("Error loading events:", error)
        toast.error("Failed to load events")
      } finally {
        setLoading(false)
      }
    }

    if (competitionId && user) {
      loadEvents()
    }
  }, [competitionId, user])

  const handleCreateEvent = async (eventData: { title: string; description: string; form_schema: any }) => {
    try {
      const newEvent = await EventService.createEvent(competitionId, eventData)
      setEvents(prev => [...prev, newEvent])
      setShowFormBuilder(false)
      setEditingEvent(null)
      toast.success("Event created successfully!")
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Failed to create event")
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowFormBuilder(true)
  }

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await EventService.deleteEvent(competitionId, eventId)
      setEvents(prev => prev.filter(event => event.id !== eventId))
      toast.success("Event deleted successfully!")
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("Failed to delete event")
    }
  }

  const handleUpdateEvent = async (eventData: { title: string; description: string; form_schema: any }) => {
    try {
      if (!editingEvent) return
      
      const updatedEvent = await EventService.updateEvent(competitionId, editingEvent.id, eventData)
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id ? updatedEvent : event
      ))
      
      setShowFormBuilder(false)
      setEditingEvent(null)
      toast.success("Event updated successfully!")
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("Failed to update event")
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

  if (showFormBuilder) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowFormBuilder(false)
              setEditingEvent(null)
            }}
          >
            ← Back to Events
          </Button>
        </div>
        
        <FormBuilder
          competitionId={competitionId}
          initialEventData={editingEvent}
          onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
          onCancel={() => {
            setShowFormBuilder(false)
            setEditingEvent(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-main">Events</h1>
          <p className="text-muted-foreground">
            Manage competition events and forms
          </p>
        </div>

        <Button 
          onClick={() => setShowFormBuilder(true)}
          size="lg"
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first event to start collecting submissions from participants.
            </p>
            <Button 
              onClick={() => setShowFormBuilder(true)}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event, index) => (
            <Card key={event.id} className="hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden relative w-3/4 ml-0 mr-auto">
              {/* Top Section - Event Name and Last Modified */}
              <div className="p-2 text-center border-b">
                <CardTitle className="text-2xl font-bold text-black flex items-center justify-center gap-2 mb-2">
                  <FileText className="h-6 w-6" />
                  {event.title}
                </CardTitle>
                <div className="flex items-center justify-center">
                  <Badge variant="secondary" className="text-xs">
                    Last modified: {new Date(event.modified_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
              
              {/* Middle Section - Description */}
              <div className="flex-1 p-2">
                {event.description ? (
                  <p className="text-gray-700 text-center text-sm">{event.description}</p>
                ) : (
                  <p className="text-muted-foreground text-center italic text-sm">No description available</p>
                )}
              </div>
              
              {/* Bottom Section - Action Buttons */}
              <div className="p-2">
                <div className="flex">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/organizer/competition/${competitionId}/events/${event.id}/submissions`)}
                    className="flex-1 items-center justify-center gap-1 rounded-r-none border-r-0"
                  >
                    <Users className="h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 items-center justify-center gap-1 rounded-none border-r-0"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="flex-1 items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 rounded-l-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
