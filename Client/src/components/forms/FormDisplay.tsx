"use client"

import { Survey } from "survey-react-ui"
import { Model } from "survey-core"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Send, FileText, CheckCircle } from "lucide-react"
import { toast } from "sonner"

// Import SurveyJS CSS
import "survey-core/survey-core.css"

interface FormDisplayProps {
  eventId: number
  eventData: any // Contains form_schema, title, description
  enrollmentId?: number // For submissions
  onSubmit?: (submissionData: any) => void
  disabled?: boolean
  showTitle?: boolean
  existingSubmission?: any // If user already submitted
  editMode?: boolean // Whether to show form in edit mode even with existing submission
}

export default function FormDisplay({ 
  eventId, 
  eventData, 
  enrollmentId,
  onSubmit, 
  disabled = false,
  showTitle = true,
  existingSubmission,
  editMode = false
}: FormDisplayProps) {
  const [survey, setSurvey] = useState<Model | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(!!existingSubmission)

  useEffect(() => {
    if (!eventData?.form_schema) return

    console.log('FormDisplay Debug:', {
      eventData,
      existingSubmission,
      editMode,
      submissionData: existingSubmission?.submission
    })

    const surveyModel = new Model(eventData.form_schema)
    
    // If there's an existing submission, populate the form
    if (existingSubmission?.submission) {
      console.log('Setting survey data:', existingSubmission.submission)
      
      // Handle case where submission might be a JSON string or already parsed
      let submissionData = existingSubmission.submission
      
      // If submission is a string, parse it
      if (typeof submissionData === 'string') {
        try {
          submissionData = JSON.parse(submissionData)
          console.log('Parsed string submission data:', submissionData)
        } catch (error) {
          console.error('Failed to parse submission data:', error)
          submissionData = existingSubmission.submission
        }
      }
      
      // Check if the submission data has a nested 'submission' field that contains the actual form data
      if (submissionData && typeof submissionData === 'object' && submissionData.submission) {
        // If it's a nested structure like {event_id: 4, enrollment_id: 33, submission: {actual_form_data}}
        if (typeof submissionData.submission === 'object') {
          submissionData = submissionData.submission
          console.log('Using nested submission data:', submissionData)
        } else if (typeof submissionData.submission === 'string') {
          try {
            submissionData = JSON.parse(submissionData.submission)
            console.log('Parsed nested submission string:', submissionData)
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
          console.log('Using cleaned form data:', submissionData)
        }
      }
      
      surveyModel.data = submissionData
      
      // Only set to display mode if editMode is false (view-only)
      if (!editMode) {
        surveyModel.mode = "display" // Read-only mode for viewing submissions
        console.log('Setting survey to display mode')
      } else {
        console.log('Setting survey to edit mode')
      }
      // If editMode is true, keep default "edit" mode for editing
    } else {
      console.log('No existing submission data found')
    }

    // Configure survey completion
    surveyModel.onComplete.add(handleSurveyComplete)

    setSurvey(surveyModel)

    return () => {
      if (surveyModel) {
        surveyModel.dispose()
      }
    }
  }, [eventData, existingSubmission, editMode])

  const handleSurveyComplete = useCallback(async (survey: Model) => {
    if (!enrollmentId) {
      console.error('FormDisplay: Missing enrollmentId:', { enrollmentId, eventId })
      toast.error("Enrollment ID missing. Please refresh the page and try again.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const submissionData = {
        event_id: eventId,
        enrollment_id: enrollmentId,
        submission: survey.data
      }

      console.log('FormDisplay: Submitting with data:', submissionData)

      if (onSubmit) {
        await onSubmit(submissionData)
        setHasSubmitted(true)
        toast.success("Submission completed successfully!")
      } else {
        console.log("FormDisplay: No onSubmit handler provided")
        toast.success("Submission completed successfully!")
        setHasSubmitted(true)
      }
    } catch (error) {
      console.error("FormDisplay: Error submitting form:", error)
      toast.error("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, enrollmentId, onSubmit, editMode])

  if (!survey) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading form...
      </div>
    )
  }

  if (hasSubmitted && existingSubmission) {
    return (
      <div className="space-y-6">
        {showTitle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {eventData.title || "Event Form"} - Submitted
              </CardTitle>
              {eventData.description && (
                <p className="text-muted-foreground">{eventData.description}</p>
              )}
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ You have already submitted this form</p>
              <p className="text-green-600 text-sm">
                Submitted on: {new Date(existingSubmission.created_at).toLocaleDateString()}
              </p>
            </div>
            <Survey model={survey} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {eventData.title || "Event Form"}
            </CardTitle>
            {eventData.description && (
              <p className="text-muted-foreground">{eventData.description}</p>
            )}
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          {!enrollmentId && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">⚠️ You must be enrolled in this competition to submit</p>
            </div>
          )}
          
          <div className={disabled ? "pointer-events-none opacity-50" : ""}>
            <Survey model={survey} />
          </div>
          
          {isSubmitting && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" />
              Submitting form...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component for viewing submission responses (for organizers)
interface SubmissionViewProps {
  submissionData: any
  eventData: any
  title?: string
}

export function SubmissionView({ submissionData, eventData, title }: SubmissionViewProps) {
  const [survey, setSurvey] = useState<Model | null>(null)

  useEffect(() => {
    if (!eventData?.form_schema || !submissionData?.submission) return

    const surveyModel = new Model(eventData.form_schema)
    surveyModel.data = submissionData.submission
    surveyModel.mode = "display" // Read-only mode
    
    setSurvey(surveyModel)

    return () => {
      if (surveyModel) {
        surveyModel.dispose()
      }
    }
  }, [eventData, submissionData])

  if (!survey) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading submission...
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title || "Submission Response"}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Submitted: {new Date(submissionData.created_at).toLocaleString()}
        </div>
      </CardHeader>
      <CardContent>
        <Survey model={survey} />
      </CardContent>
    </Card>
  )
}