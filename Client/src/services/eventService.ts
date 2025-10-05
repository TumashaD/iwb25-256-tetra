// Event Service for managing competition events and form submissions
import { apiCall } from '@/lib/api'

interface Event {
  id: number
  title: string
  description?: string
  competition_id: number
  form_schema: any
  created_at: string
  modified_at: string
}

interface Submission {
  id: number
  event_id: number
  enrollment_id: number
  submission: any
  created_at: string
  modified_at: string
}

interface CreateEventData {
  title: string
  description: string
  form_schema: any
}

interface SubmissionData {
  event_id: number
  enrollment_id: number
  submission: any
}

export class EventService {
  // Events API
  
  /**
   * Get all events for a competition
   */
  static async getEvents(competitionId: number): Promise<Event[]> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/events`, {
        method: 'GET',
      })
      return result.events || []
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw new Error('Failed to fetch events. Please try again later.')
    }
  }

  /**
   * Get a specific event by ID
   */
  static async getEvent(competitionId: number, eventId: number): Promise<Event> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/events/${eventId}`, {
        method: 'GET',
      })
      return result
    } catch (error) {
      console.error('Failed to fetch event:', error)
      throw new Error('Failed to fetch event. Please try again later.')
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(competitionId: number, eventData: CreateEventData): Promise<Event> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/events`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      })
      return result.event || result
    } catch (error) {
      console.error('Failed to create event:', error)
      throw new Error('Failed to create event. Please try again later.')
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(competitionId: number, eventId: number, updateData: Partial<CreateEventData>): Promise<Event> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      })
      return result.event || result
    } catch (error) {
      console.error('Failed to update event:', error)
      throw new Error('Failed to update event. Please try again later.')
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(competitionId: number, eventId: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/events/${eventId}`, {
        method: 'DELETE',
      })
      return result
    } catch (error) {
      console.error('Failed to delete event:', error)
      throw new Error('Failed to delete event. Please try again later.')
    }
  }

  // Submissions API
  
  /**
   * Submit a form response
   */
  static async submitForm(competitionId: number, submissionData: SubmissionData): Promise<Submission> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/submissions`, {
        method: 'POST',
        body: JSON.stringify(submissionData),
      })
      return result
    } catch (error) {
      console.error('Failed to submit form:', error)
      throw new Error('Failed to submit form. Please try again later.')
    }
  }

  /**
   * Get all submissions for an event (for organizers)
   */
  static async getEventSubmissions(eventId: number): Promise<Submission[]> {
    try {
      const result = await apiCall(`/events/events/${eventId}/submissions`, {
        method: 'GET',
      })
      return result.submissions || []
    } catch (error) {
      console.error('Failed to fetch event submissions:', error)
      throw new Error('Failed to fetch event submissions. Please try again later.')
    }
  }

  /**
   * Get all submissions for a competition (for organizers)
   */
  static async getCompetitionSubmissions(competitionId: number): Promise<Submission[]> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/submissions`, {
        method: 'GET',
      })
      return result.submissions || []
    } catch (error) {
      console.error('Failed to fetch competition submissions:', error)
      throw new Error('Failed to fetch competition submissions. Please try again later.')
    }
  }

  /**
   * Get user's submissions for a competition
   */
  static async getUserSubmissions(competitionId: number, enrollmentId: number): Promise<Submission[]> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/submissions/user/${enrollmentId}`, {
        method: 'GET',
      })
      return result.submissions || []
    } catch (error) {
      console.error('Failed to fetch user submissions:', error)
      throw new Error('Failed to fetch user submissions. Please try again later.')
    }
  }

  /**
   * Check if user has submitted for a specific event
   */
  static async hasUserSubmitted(eventId: number, enrollmentId: number): Promise<Submission | null> {
    try {
      const submissions = await this.getEventSubmissions(eventId)
      return submissions.find(sub => sub.enrollment_id === enrollmentId) || null
    } catch (error) {
      console.error('Error checking user submission:', error)
      return null
    }
  }

  /**
   * Get event with user's submission status
   */
  static async getEventWithSubmission(competitionId: number, eventId: number, enrollmentId?: number): Promise<{ event: Event; submission?: Submission }> {
    const event = await this.getEvent(competitionId, eventId)
    
    let submission: Submission | undefined
    if (enrollmentId) {
      submission = await this.hasUserSubmitted(eventId, enrollmentId) || undefined
    }
    
    return { event, submission }
  }

  /**
   * Update an existing submission
   */
  static async updateSubmission(competitionId: number, submissionId: number, submissionData: any): Promise<Submission> {
    try {
      const result = await apiCall(`/events/competitions/${competitionId}/submissions/${submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ submission: submissionData }),
      })
      return result
    } catch (error) {
      console.error('Failed to update submission:', error)
      throw new Error('Failed to update submission. Please try again later.')
    }
  }

  /**
   * Delete a submission
   */
  static async deleteSubmission(competitionId: number, submissionId: number): Promise<void> {
    try {
      await apiCall(`/events/competitions/${competitionId}/submissions/${submissionId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to delete submission:', error)
      throw new Error('Failed to delete submission. Please try again later.')
    }
  }

  // Utility methods
  
  /**
   * Validate form schema structure
   */
  static validateFormSchema(schema: any): boolean {
    if (!schema || typeof schema !== 'object') {
      return false
    }
    
    // Basic validation - check if it has elements array
    if (!Array.isArray(schema.elements)) {
      return false
    }
    
    // Validate each element has required properties
    return schema.elements.every((element: any) => 
      element && 
      typeof element.type === 'string' && 
      typeof element.name === 'string'
    )
  }

  /**
   * Sanitize form data before submission
   */
  static sanitizeSubmission(submission: any): any {
    if (!submission || typeof submission !== 'object') {
      return {}
    }
    
    // Remove any potentially harmful properties
    const sanitized = { ...submission }
    delete sanitized.__proto__
    delete sanitized.constructor
    
    return sanitized
  }

  /**
   * Format event for display
   */
  static formatEvent(event: Event): Event & { createdAtFormatted: string; modifiedAtFormatted: string } {
    return {
      ...event,
      createdAtFormatted: new Date(event.created_at).toLocaleDateString(),
      modifiedAtFormatted: new Date(event.modified_at).toLocaleDateString()
    }
  }

  /**
   * Format submission for display
   */
  static formatSubmission(submission: Submission): Submission & { submittedAtFormatted: string } {
    return {
      ...submission,
      submittedAtFormatted: new Date(submission.created_at).toLocaleString()
    }
  }
}

export type { Event, Submission, CreateEventData, SubmissionData }