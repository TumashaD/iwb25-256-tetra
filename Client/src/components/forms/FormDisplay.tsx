"use client"

import { Survey } from "survey-react-ui"
import { Model } from "survey-core"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send, FileText, CheckCircle, User, Calendar, Upload, Download, Eye } from "lucide-react"
import { toast } from "sonner"
import { apiCall } from "@/lib/api"

// Import SurveyJS CSS
import "survey-core/survey-core.css"

interface FormDisplayProps {
  eventId: number
  eventData: any // Contains form_schema, title, description
  competitionId: number // Competition ID for file uploads
  enrollmentId?: number // For submissions
  onSubmit?: (submissionData: any) => void
  disabled?: boolean
  showTitle?: boolean
  existingSubmission?: any // If user already submitted
  editMode?: boolean // Whether to show form in edit mode even with existing submission
  viewMode?: 'form' | 'submission' // 'form' shows interactive form, 'submission' shows formatted data
}

export default function FormDisplay({ 
  eventId, 
  eventData, 
  competitionId,
  enrollmentId,
  onSubmit, 
  disabled = false,
  showTitle = true,
  existingSubmission,
  editMode = false,
  viewMode = 'form'
}: FormDisplayProps) {
  const [survey, setSurvey] = useState<Model | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(!!existingSubmission)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any[]>>({})

  // Check if form has file upload fields
  const hasFileFields = eventData?.form_schema?.elements?.some((element: any) => element.type === 'file')

  // Clean submission data once for reuse
  const getCleanedSubmissionData = () => {
    if (!existingSubmission?.submission) return null

    let submissionData = existingSubmission.submission
    
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
      // If it's a nested structure like {event_id: 4, enrollment_id: 33, submission: {actual_form_data}}
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

  useEffect(() => {
    if (!eventData?.form_schema) return

    const surveyModel = new Model(eventData.form_schema)
    
    // If there's an existing submission, populate the form
    if (existingSubmission?.submission) {
      const cleanedData = getCleanedSubmissionData()
      if (cleanedData) {
        surveyModel.data = cleanedData
        
        // For custom forms with file fields, also initialize formData and uploadedFiles
        if (hasFileFields && cleanedData) {
          setFormData(cleanedData)
          
          // Extract file fields and populate uploadedFiles state for UI display
          const fileFieldData: Record<string, any[]> = {}
          eventData.form_schema.elements?.forEach((element: any) => {
            if (element.type === 'file' && cleanedData[element.name]) {
              fileFieldData[element.name] = cleanedData[element.name]
            }
          })
          setUploadedFiles(fileFieldData)
        }
        
        // Only set to display mode if editMode is false (view-only)
        if (!editMode) {
          surveyModel.mode = "display" // Read-only mode for viewing submissions
        }
      }
    }

    // Configure survey completion
    surveyModel.onComplete.add(handleSurveyComplete)

    setSurvey(surveyModel)

    return () => {
      if (surveyModel) {
        surveyModel.dispose()
      }
    }
  }, [eventData, existingSubmission, editMode, hasFileFields])

  // Handle file uploads for form submission
  const handleFileUpload = async (files: FileList, fieldName: string, competitionId: number) => {
    if (!enrollmentId) {
      toast.error("Enrollment ID missing for file upload")
      return []
    }

    try {
      const formData = new FormData()
      
      // Add all files to form data
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const result = await apiCall(`/events/competitions/${competitionId}/events/${eventId}/submissions/${enrollmentId}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (result.files && Array.isArray(result.files)) {
        return result.files.map((file: any) => ({
          name: file.fileName,
          url: file.url,
          status: file.status
        }))
      }
      
      return []
    } catch (error) {
      console.error("File upload error:", error)
      toast.error("Failed to upload files")
      return []
    }
  }

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

      if (onSubmit) {
        await onSubmit(submissionData)
        setHasSubmitted(true)
        toast.success("Submission completed successfully!")
      } else {
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

  // Custom form submission handler for forms with file uploads
  const handleCustomFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!enrollmentId) {
      toast.error("Enrollment ID missing. Please refresh the page and try again.")
      return
    }

    setIsSubmitting(true)

    try {
      // Form data already includes uploaded file URLs, so just use that
      const submissionData = {
        event_id: eventId,
        enrollment_id: enrollmentId,
        submission: formData  // formData now includes both regular fields and file URLs
      }

      if (onSubmit) {
        await onSubmit(submissionData)
        setHasSubmitted(true)
        toast.success("Submission completed successfully!")
      } else {
        toast.success("Submission completed successfully!")
        setHasSubmitted(true)
      }
    } catch (error) {
      console.error("FormDisplay: Error submitting form:", error)
      toast.error("Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [eventId, enrollmentId, onSubmit, formData])

  // Handle file input changes
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = e.target.files
    toast.loading(`Uploading ${files.length} file(s)...`)

    try {
      const uploadedFileInfo = await handleFileUpload(files, fieldName, competitionId)
      
      // Store uploaded files in both uploadedFiles state (for UI) and formData (for submission)
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: uploadedFileInfo
      }))
      
      // Store file info in form data so it gets included in submission
      setFormData(prev => ({
        ...prev,
        [fieldName]: uploadedFileInfo
      }))
      
      toast.dismiss()
      toast.success(`Successfully uploaded ${uploadedFileInfo.length} file(s)`)
    } catch (error) {
      toast.dismiss()
      toast.error("Failed to upload files")
    }
  }

  // Render custom form for file upload fields
  const renderCustomForm = () => {
    if (!eventData?.form_schema?.elements) return null

    return (
      <form onSubmit={handleCustomFormSubmit} className="space-y-6">
        {eventData.form_schema.elements.map((element: any, index: number) => (
          <div key={element.name || index} className="space-y-2">
            <Label className="flex items-center gap-2">
              {element.title || element.name}
              {element.isRequired && <span className="text-red-500">*</span>}
            </Label>

            {element.type === 'text' && (
              <Input
                name={element.name}
                value={formData[element.name] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [element.name]: e.target.value }))}
                placeholder={element.placeholder || `Enter ${element.title}`}
                required={element.isRequired}
              />
            )}

            {element.type === 'comment' && (
              <textarea
                name={element.name}
                value={formData[element.name] || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, [element.name]: e.target.value }))}
                placeholder={element.placeholder || `Enter ${element.title}`}
                required={element.isRequired}
                className="w-full p-3 border border-gray-300 rounded-md min-h-[100px] resize-vertical"
              />
            )}

            {element.type === 'file' && (
              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  accept={element.acceptedFileTypes?.join(',') || '.pdf,.jpg,.jpeg,.png,.ppt,.pptx,.zip'}
                  onChange={(e) => handleFileChange(e, element.name)}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {element.acceptedFileTypes && element.acceptedFileTypes.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Accepted types: {element.acceptedFileTypes.join(', ')}
                  </p>
                )}

                {(uploadedFiles[element.name] || formData[element.name]) && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-green-600">
                      {uploadedFiles[element.name] ? 'Uploaded files:' : 'Existing files:'}
                    </p>
                    {(uploadedFiles[element.name] || formData[element.name] || []).map((file: any, fileIndex: number) => (
                      <div key={fileIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{file.name}</span>
                        {file.url && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(file.url, '_blank')}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a')
                                link.href = file.url
                                link.download = file.name || 'download'
                                link.click()
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !enrollmentId}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </form>
    )
  }

  if (!survey && !hasFileFields) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading form...
      </div>
    )
  }

  // If has file fields, use custom form instead of Survey
  if (hasFileFields) {
    // For viewing submission with files
    if (hasSubmitted && existingSubmission && !editMode) {
      const cleanedData = getCleanedSubmissionData()
      if (cleanedData && eventData?.form_schema) {
        return (
          <SubmissionView
            formSchema={eventData.form_schema}
            submissionData={cleanedData}
            eventData={eventData}
            existingSubmission={existingSubmission}
            title={eventData.title}
          />
        )
      }
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
              {renderCustomForm()}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading form...
      </div>
    )
  }

  // If viewing submission (not editing), use the improved view
  if (hasSubmitted && existingSubmission && !editMode) {
    const cleanedData = getCleanedSubmissionData()
    if (cleanedData && eventData?.form_schema) {
      return (
        <SubmissionView
          formSchema={eventData.form_schema}
          submissionData={cleanedData}
          eventData={eventData}
          existingSubmission={existingSubmission}
        />
      )
    }
  }

  // Original form display for submitted but now editing, or fallback
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

// Component for viewing submission responses (for organizers and competitors)
interface SubmissionViewProps {
  formSchema: any
  submissionData: any
  eventData: any
  existingSubmission: any
  title?: string
}

export function SubmissionView({ formSchema, submissionData, eventData, existingSubmission, title }: SubmissionViewProps) {
  const renderSubmissionField = (element: any, value: any) => {
    if (value === undefined || value === null || value === '') return null

    const getFieldLabel = () => {
      return element.title || element.name || 'Field'
    }

    const renderValue = () => {
      switch (element.type) {
        case 'radiogroup':
        case 'dropdown':
          // Find the choice that matches the value
          const choice = element.choices?.find((c: any) => 
            (typeof c === 'string' ? c : c.value) === value
          )
          return choice ? (typeof choice === 'string' ? choice : choice.text || choice.value) : value
        
        case 'checkbox':
          if (Array.isArray(value)) {
            return value.map(v => {
              const choice = element.choices?.find((c: any) => 
                (typeof c === 'string' ? c : c.value) === v
              )
              return choice ? (typeof choice === 'string' ? choice : choice.text || choice.value) : v
            }).join(', ')
          }
          return value
        
        case 'boolean':
          return value ? 'Yes' : 'No'
        
        case 'rating':
          return `${value} / ${element.rateMax || 5}`
        
        case 'file':
          if (Array.isArray(value)) {
            return (
              <div className="space-y-2">
                {value.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="flex-1">{file.name || file}</span>
                    {file.url && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = file.url
                            link.download = file.name || 'download'
                            link.click()
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
          
          if (typeof value === 'object' && value.url) {
            return (
              <div className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="flex-1">{value.name || 'File'}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(value.url, '_blank')}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = value.url
                      link.download = value.name || 'download'
                      link.click()
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          }
          
          return value.name || value
        
        default:
          return value
      }
    }

    return (
      <div key={element.name} className="border-b border-gray-100 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
        <dt className="text-sm font-medium text-gray-600 mb-1">
          {getFieldLabel()}
        </dt>
        <dd className="text-sm text-gray-900">
          {renderValue()}
        </dd>
      </div>
    )
  }

  const getAllFormElements = (schema: any): any[] => {
    let elements: any[] = []
    
    if (schema.elements) {
      elements = [...schema.elements]
    }
    
    if (schema.pages) {
      schema.pages.forEach((page: any) => {
        if (page.elements) {
          elements = [...elements, ...page.elements]
        }
      })
    }
    
    return elements
  }

  const formElements = getAllFormElements(formSchema)

  return (
    <div className="space-y-6">
      {/* Submission Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title || eventData.title || "Event Form"} - Submission Details
          </CardTitle>
          {eventData.description && (
            <p className="text-muted-foreground">{eventData.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Submission Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Submission Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-600">Enrollment ID</dt>
              <dd className="text-sm text-gray-900">{existingSubmission.enrollment_id}</dd>
            </div>
            <div className="border-b border-gray-100 pb-3">
              <dt className="text-sm font-medium text-gray-600">Submitted At</dt>
              <dd className="text-sm text-gray-900 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(existingSubmission.created_at).toLocaleString()}
              </dd>
            </div>
            {existingSubmission.modified_at !== existingSubmission.created_at && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Last Modified</dt>
                <dd className="text-sm text-gray-900 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(existingSubmission.modified_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Form Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {formElements.map(element => renderSubmissionField(element, submissionData[element.name]))}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}