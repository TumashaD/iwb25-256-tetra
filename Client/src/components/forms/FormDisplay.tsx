"use client"

import { Survey } from "survey-react-ui"
import { Model } from "survey-core"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send, FileText, CheckCircle, User, Calendar, Upload, Download, Eye, Edit } from "lucide-react"
import { toast } from "sonner"
import { apiCall } from "@/lib/api"

// Import SurveyJS CSS
import "survey-core/survey-core.css"

// Custom styles for Survey component
const surveyStyles = `
  .sd-root-modern {
    --sd-color-primary: #ec4899 !important;
    --sd-color-primary-dark: #be185d !important;
    --sd-color-primary-light: #f9a8d4 !important;
  }
  
  .sd-btn--action {
    background-color: #ec4899 !important;
    border-color: #ec4899 !important;
    border-radius: 16px !important;
    padding: 8px 16px !important;
    font-weight: 500 !important;
  }
  
  .sd-btn--action:hover {
    background-color: #be185d !important;
    border-color: #be185d !important;
  }
  
  .sd-question {
    margin-bottom: 24px !important;
    padding: 16px !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    background-color: #ffffff !important;
  }
  
  .sd-question__title {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: #1f2937 !important;
    margin-bottom: 8px !important;
  }
  
  .sd-input, .sd-text, .sd-textarea {
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
  }
  
  .sd-input:focus, .sd-text:focus, .sd-textarea:focus {
    border-color: #ec4899 !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
  }
  
  .sd-selectbase {
    border: 1px solid #d1d5db !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
  }
  
  .sd-radio, .sd-checkbox {
    margin-bottom: 8px !important;
  }
  
  .sd-radio__control, .sd-checkbox__control {
    border: 2px solid #d1d5db !important;
    border-radius: 4px !important;
  }
  
  .sd-radio__control:checked, .sd-checkbox__control:checked {
    background-color: #ec4899 !important;
    border-color: #ec4899 !important;
  }
  
  .sd-file__input {
    border: 2px dashed #d1d5db !important;
    border-radius: 8px !important;
    padding: 16px !important;
    text-align: center !important;
  }
  
  .sd-navigation {
    margin-top: 24px !important;
    text-align: center !important;
  }
`

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
    
    // Hide default survey navigation/submit buttons
    surveyModel.showNavigationButtons = false
    surveyModel.showCompletedPage = false
    
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

  // Unified form renderer for both text-only and file forms
  const renderCustomForm = () => {
    if (!eventData?.form_schema?.elements) return null

    // Initialize formData from survey data for text-only forms if needed
    if (!hasFileFields && survey && !formData) {
      const surveyData = survey.data || {}
      setFormData(surveyData)
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (hasFileFields) {
        await handleCustomFormSubmit(e)
      } else {
        // For text-only forms, trigger survey completion
        if (survey) {
          survey.data = formData
          survey.doComplete()
        }
      }
    }

    const getValue = (fieldName: string) => {
      if (hasFileFields) {
        return formData[fieldName] || ''
      } else {
        return survey?.data[fieldName] || formData[fieldName] || ''
      }
    }

    const setValue = (fieldName: string, value: any) => {
      if (hasFileFields) {
        setFormData(prev => ({ ...prev, [fieldName]: value }))
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: value }))
        if (survey) {
          survey.setValue(fieldName, value)
        }
      }
    }

    return (
      <div className="space-y-6">
        {/* Edit mode notification - only show once */}
        {editMode && existingSubmission && !hasSubmitted && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">✏️ You are editing your submission</p>
            <p className="text-blue-600 text-sm">
              Originally submitted on: {new Date(existingSubmission.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {eventData.form_schema.elements.map((element: any, index: number) => (
            <div key={element.name || index} className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold text-gray-800">
                {element.title || element.name}
                {element.isRequired && <span className="text-red-500">*</span>}
              </Label>

              {element.type === 'text' && (
                <Input
                  name={element.name}
                  value={getValue(element.name)}
                  onChange={(e) => setValue(element.name, e.target.value)}
                  placeholder={element.placeholder || `Enter ${element.title}`}
                  required={element.isRequired}
                  readOnly={!editMode && hasSubmitted}
                  disabled={!editMode && hasSubmitted}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    !editMode && hasSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              )}

              {element.type === 'comment' && (
                <textarea
                  name={element.name}
                  value={getValue(element.name)}
                  onChange={(e) => setValue(element.name, e.target.value)}
                  placeholder={element.placeholder || `Enter ${element.title}`}
                  required={element.isRequired}
                  readOnly={!editMode && hasSubmitted}
                  disabled={!editMode && hasSubmitted}
                  className={`w-full p-3 border border-gray-300 rounded-md min-h-[100px] resize-vertical focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    !editMode && hasSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              )}

              {element.type === 'file' && (
                <div className="space-y-4 p-5 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      accept={element.acceptedFileTypes?.join(',') || '.pdf,.jpg,.jpeg,.png,.ppt,.pptx,.zip'}
                      onChange={(e) => handleFileChange(e, element.name)}
                      className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 border border-gray-300 rounded-lg"
                    />
                    
                    {element.acceptedFileTypes && element.acceptedFileTypes.length > 0 && (
                      <p className="text-xs text-gray-500 px-2">
                        Accepted types: {element.acceptedFileTypes.join(', ')}
                      </p>
                    )}
                  </div>

                  {(uploadedFiles[element.name] || formData[element.name]) && (
                    <div className="mt-3 p-3 bg-white rounded-md border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-2">
                        {uploadedFiles[element.name] ? '📁 Uploaded files:' : '📂 Existing files:'}
                      </p>
                      <div className="space-y-2">
                        {(uploadedFiles[element.name] || formData[element.name] || []).map((file: any, fileIndex: number) => (
                          <div key={fileIndex} className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            </div>
                            {file.url && (
                              <div className="flex gap-1 ml-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="h-7 w-7 p-0 hover:bg-green-100"
                                  title="View file"
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
                                  className="h-7 w-7 p-0 hover:bg-green-100"
                                  title="Download file"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {element.type === 'radiogroup' && (
                <div className="space-y-2">
                  {element.choices?.map((choice: string, choiceIndex: number) => (
                    <div key={choiceIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`${element.name}_${choiceIndex}`}
                        name={element.name}
                        value={choice}
                        checked={getValue(element.name) === choice}
                        onChange={(e) => setValue(element.name, e.target.value)}
                        required={element.isRequired}
                        disabled={!editMode && hasSubmitted}
                        className={`h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 ${
                          !editMode && hasSubmitted ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      />
                      <label 
                        htmlFor={`${element.name}_${choiceIndex}`}
                        className={`text-sm text-gray-700 ${
                          !editMode && hasSubmitted ? 'cursor-not-allowed opacity-50' : ''
                        }`}
                      >
                        {choice}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {element.type === 'checkbox' && (
                <div className="space-y-2">
                  {element.choices?.map((choice: string, choiceIndex: number) => {
                    const currentValues = Array.isArray(getValue(element.name)) ? getValue(element.name) : []
                    
                    return (
                      <div key={choiceIndex} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${element.name}_${choiceIndex}`}
                          value={choice}
                          checked={currentValues.includes(choice)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue(element.name, [...currentValues, choice])
                            } else {
                              setValue(element.name, currentValues.filter((v: string) => v !== choice))
                            }
                          }}
                          disabled={!editMode && hasSubmitted}
                          className={`h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded ${
                            !editMode && hasSubmitted ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        />
                        <label 
                          htmlFor={`${element.name}_${choiceIndex}`}
                          className={`text-sm text-gray-700 ${
                            !editMode && hasSubmitted ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          {choice}
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}

              {element.type === 'dropdown' && (
                <select
                  name={element.name}
                  value={getValue(element.name)}
                  onChange={(e) => setValue(element.name, e.target.value)}
                  required={element.isRequired}
                  disabled={!editMode && hasSubmitted}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                    !editMode && hasSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select an option</option>
                  {element.choices?.map((choice: string, choiceIndex: number) => (
                    <option key={choiceIndex} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          {/* Only show submit button in edit mode or for new submissions */}
          {(editMode || !hasSubmitted) && (
            <div className="mt-6 flex justify-start">
              <Button 
                type="submit"
                disabled={isSubmitting || (!hasFileFields && !enrollmentId)}
                className="gap-2 bg-pink-600 rounded-2xl hover:bg-pink-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editMode ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {editMode ? 'Update Submission' : 'Submit Response'}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
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

    // For editing or new submission with files
    if (hasSubmitted && existingSubmission && editMode) {
      return (
        <div className="space-y-6">
          {/* Event Information and Submission Info Row */}
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
                      <h3 className="text-3xl font-bold text-black mb-2">{eventData.title}</h3>
                      {eventData.description && (
                        <p className="text-gray-700">{eventData.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submission Information - 1/3 width */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-main">
                    <User className="h-5 w-5" />
                    Editing Submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Enrollment ID</p>
                      <p className="text-lg font-semibold text-black">{existingSubmission.enrollment_id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Date Submitted</p>
                        <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Time Submitted</p>
                        <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {existingSubmission.modified_at !== existingSubmission.created_at && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Updated</p>
                          <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Time Updated</p>
                          <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-main">
                <Edit className="h-5 w-5" />
                Edit Submission
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className={disabled ? "pointer-events-none opacity-50" : ""}>
                {renderCustomForm()}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // For new submission with files
    return (
      <div className="space-y-6">
        {/* Event Information */}
        {showTitle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-main">
                <FileText className="h-6 w-6" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-black mb-2">{eventData.title || "Event Form"}</h3>
                  {eventData.description && (
                    <p className="text-gray-700">{eventData.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-main">
              <Send className="h-5 w-5" />
              Submit Your Response
            </CardTitle>
          </CardHeader>
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

  // All forms should use the enhanced layout now
  // Remove the separate Survey component path

  // Original form display for submitted but now editing, or fallback
  if (hasSubmitted && existingSubmission) {
    return (
      <div className="space-y-6">
        {/* Event Information and Submission Info Row */}
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
                    <h3 className="text-3xl font-bold text-black mb-2">{eventData.title}</h3>
                    {eventData.description && (
                      <p className="text-gray-700">{eventData.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission Information - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-main">
                  <User className="h-5 w-5" />
                  Editing Submission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Enrollment ID</p>
                    <p className="text-lg font-semibold text-black">{existingSubmission.enrollment_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date Submitted</p>
                      <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time Submitted</p>
                      <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  {existingSubmission.modified_at !== existingSubmission.created_at && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Updated</p>
                        <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Time Updated</p>
                        <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-main">
              <Edit className="h-5 w-5" />
              Edit Submission
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className={disabled ? "pointer-events-none opacity-50" : ""}>
              {renderCustomForm()}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Event Information */}
      {showTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-main">
              <FileText className="h-6 w-6" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-3xl font-bold text-black mb-2">{eventData.title || "Event Form"}</h3>
                {eventData.description && (
                  <p className="text-gray-700">{eventData.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-main">
            <Send className="h-5 w-5" />
            Submit Your Response
          </CardTitle>
        </CardHeader>
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
      {/* First Row: Event Info (2/3) and Submission Info (1/3) */}
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
                  <h3 className="text-2xl font-bold text-black mb-2">{eventData.title}</h3>
                  {eventData.description && (
                    <p className="text-gray-700">{eventData.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submission Information - 1/3 width */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-main">
                <User className="h-5 w-5" />
                Submission Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enrollment ID</p>
                  <p className="text-lg font-semibold text-black">{existingSubmission.enrollment_id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Date Submitted</p>
                    <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Submitted</p>
                    <p className="text-sm text-gray-900">{new Date(existingSubmission.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                {existingSubmission.modified_at !== existingSubmission.created_at && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time Updated</p>
                      <p className="text-sm text-gray-900">{new Date(existingSubmission.modified_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-main">
            <FileText className="h-6 w-6" />
            Responses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formElements.map(element => {
              const value = submissionData[element.name]
              if (value === undefined || value === null || value === '') return null

              const getFieldLabel = () => {
                return element.title || element.name || 'Field'
              }

              const renderValue = () => {
                switch (element.type) {
                  case 'radiogroup':
                  case 'dropdown':
                    const choice = element.choices?.find((c: any) => 
                      (typeof c === 'string' ? c : c.value) === value
                    )
                    return choice ? (typeof choice === 'string' ? choice : choice.text || choice.value) : value
                  
                  case 'checkbox':
                    if (Array.isArray(value)) {
                      return (
                        <div className="space-y-2">
                          {value.map((v, index) => {
                            const choice = element.choices?.find((c: any) => 
                              (typeof c === 'string' ? c : c.value) === v
                            )
                            const displayText = choice ? (typeof choice === 'string' ? choice : choice.text || choice.value) : v
                            return (
                              <div key={index} className="px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                                <span className="text-green-800 font-medium">{displayText}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    return (
                      <div className="px-3 py-2 bg-green-100 border border-green-300 rounded-lg">
                        <span className="text-green-800 font-medium">{value}</span>
                      </div>
                    )
                  
                  case 'boolean':
                    return (
                      <div className={`px-3 py-2 rounded-lg border ${value ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${value ? 'bg-green-500' : 'bg-red-500'}`}>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span className={`font-medium ${value ? 'text-green-800' : 'text-red-800'}`}>
                            {value ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    )
                  
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
                <div key={element.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {getFieldLabel()}
                    </h4>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-900 font-medium">
                      {renderValue()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}