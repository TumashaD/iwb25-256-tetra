"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

interface FormField {
  name: string
  title: string
  type: 'text' | 'comment' | 'radiogroup' | 'checkbox' | 'dropdown' | 'file'
  isRequired: boolean
  choices?: string[]
  acceptedFileTypes?: string[]
}

interface SimpleFormBuilderProps {
  competitionId: number
  initialEventData?: {
    id: number
    title: string
    description?: string
    form_schema: any
  } | null
  onSave: (eventData: { title: string; description: string; form_schema: any }) => void
  onCancel: () => void
}

export default function SimpleFormBuilder({ 
  competitionId, 
  initialEventData, 
  onSave, 
  onCancel 
}: SimpleFormBuilderProps) {
  const [eventTitle, setEventTitle] = useState(initialEventData?.title || "")
  const [eventDescription, setEventDescription] = useState(initialEventData?.description || "")
  
  const [fields, setFields] = useState<FormField[]>(() => {
    if (initialEventData?.form_schema?.elements) {
      return initialEventData.form_schema.elements.map((element: any) => ({
        name: element.name || '',
        title: element.title || '',
        type: element.type || 'text',
        isRequired: element.isRequired || false,
        choices: element.choices || [],
        acceptedFileTypes: element.acceptedFileTypes || []
      }))
    }
    
    // Default fields
    return [
      {
        name: "team_name",
        title: "Team Name",
        type: "text" as const,
        isRequired: true,
        choices: [],
        acceptedFileTypes: []
      },
      {
        name: "submission_details",
        title: "Submission Details",
        type: "comment" as const,
        isRequired: true,
        choices: [],
        acceptedFileTypes: []
      }
    ]
  })

  const [previewMode, setPreviewMode] = useState(false)

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      title: "New Field",
      type: "text",
      isRequired: false,
      choices: [],
      acceptedFileTypes: []
    }
    setFields([...fields, newField])
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const removeField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index))
    } else {
      toast.error("You need at least one field")
    }
  }

  const addChoice = (fieldIndex: number) => {
    const newFields = [...fields]
    if (!newFields[fieldIndex].choices) {
      newFields[fieldIndex].choices = []
    }
    newFields[fieldIndex].choices!.push(`Option ${newFields[fieldIndex].choices!.length + 1}`)
    setFields(newFields)
  }

  const updateChoice = (fieldIndex: number, choiceIndex: number, value: string) => {
    const newFields = [...fields]
    if (newFields[fieldIndex].choices) {
      newFields[fieldIndex].choices![choiceIndex] = value
      setFields(newFields)
    }
  }

  const removeChoice = (fieldIndex: number, choiceIndex: number) => {
    const newFields = [...fields]
    if (newFields[fieldIndex].choices && newFields[fieldIndex].choices!.length > 1) {
      newFields[fieldIndex].choices!.splice(choiceIndex, 1)
      setFields(newFields)
    }
  }

  const addFileType = (fieldIndex: number) => {
    const newFields = [...fields]
    if (!newFields[fieldIndex].acceptedFileTypes) {
      newFields[fieldIndex].acceptedFileTypes = []
    }
    newFields[fieldIndex].acceptedFileTypes!.push('.pdf')
    setFields(newFields)
  }

  const updateFileType = (fieldIndex: number, typeIndex: number, value: string) => {
    const newFields = [...fields]
    if (newFields[fieldIndex].acceptedFileTypes) {
      newFields[fieldIndex].acceptedFileTypes![typeIndex] = value
      setFields(newFields)
    }
  }

  const removeFileType = (fieldIndex: number, typeIndex: number) => {
    const newFields = [...fields]
    if (newFields[fieldIndex].acceptedFileTypes && newFields[fieldIndex].acceptedFileTypes!.length > 1) {
      newFields[fieldIndex].acceptedFileTypes!.splice(typeIndex, 1)
      setFields(newFields)
    }
  }

  const generateFormSchema = () => {
    return {
      title: eventTitle,
      description: eventDescription,
      elements: fields.map(field => {
        const element: any = {
          type: field.type,
          name: field.name,
          title: field.title,
          isRequired: field.isRequired
        }

        if (field.type === 'radiogroup' || field.type === 'checkbox' || field.type === 'dropdown') {
          element.choices = field.choices || []
        }

        if (field.type === 'file') {
          element.acceptedFileTypes = field.acceptedFileTypes || []
        }

        return element
      })
    }
  }

  const handleSave = () => {
    if (!eventTitle.trim()) {
      toast.error("Event title is required")
      return
    }

    if (fields.length === 0) {
      toast.error("At least one field is required")
      return
    }

    // Check for empty field names
    const emptyNameFields = fields.filter(field => !field.name.trim())
    if (emptyNameFields.length > 0) {
      toast.error("All fields must have a name")
      return
    }

    const formSchema = generateFormSchema()
    
    onSave({
      title: eventTitle,
      description: eventDescription,
      form_schema: formSchema
    })
  }

  const getFieldTypeDisplay = (type: string) => {
    switch (type) {
      case 'text': return 'Text Input'
      case 'comment': return 'Text Area'
      case 'radiogroup': return 'Radio Buttons'
      case 'checkbox': return 'Checkboxes'
      case 'dropdown': return 'Dropdown'
      case 'file': return 'File Upload'
      default: return type
    }
  }

  if (previewMode) {
    const schema = generateFormSchema()
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Form Preview</h2>
          <Button variant="outline" onClick={() => setPreviewMode(false)}>
            Back to Editor
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{schema.title}</CardTitle>
            {schema.description && <p className="text-muted-foreground">{schema.description}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {schema.elements.map((element: any, index: number) => (
              <div key={index} className="space-y-2">
                <Label className="flex items-center gap-2">
                  {element.title}
                  {element.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </Label>
                
                {element.type === 'text' && (
                  <Input placeholder={`Enter ${element.title.toLowerCase()}`} disabled />
                )}
                
                {element.type === 'comment' && (
                  <Textarea placeholder={`Enter ${element.title.toLowerCase()}`} disabled />
                )}
                
                {element.type === 'radiogroup' && (
                  <div className="space-y-2">
                    {element.choices?.map((choice: string, choiceIndex: number) => (
                      <div key={choiceIndex} className="flex items-center space-x-2">
                        <input type="radio" name={element.name} disabled />
                        <label>{choice}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {element.type === 'checkbox' && (
                  <div className="space-y-2">
                    {element.choices?.map((choice: string, choiceIndex: number) => (
                      <div key={choiceIndex} className="flex items-center space-x-2">
                        <input type="checkbox" disabled />
                        <label>{choice}</label>
                      </div>
                    ))}
                  </div>
                )}
                
                {element.type === 'dropdown' && (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${element.title.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {element.choices?.map((choice: string, choiceIndex: number) => (
                        <SelectItem key={choiceIndex} value={choice}>
                          {choice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {element.type === 'file' && (
                  <div className="space-y-2">
                    <Input type="file" disabled />
                    {element.acceptedFileTypes && element.acceptedFileTypes.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Accepted types: {element.acceptedFileTypes.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialEventData ? 'Edit Event' : 'Create New Event'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave}>
            {initialEventData ? 'Update Event' : 'Create Event'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>
          <div>
            <Label htmlFor="description">Event Description</Label>
            <Textarea
              id="description"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Enter event description (optional)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{getFieldTypeDisplay(field.type)}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => updateField(index, { name: e.target.value })}
                      placeholder="field_name"
                    />
                  </div>
                  <div>
                    <Label>Field Title</Label>
                    <Input
                      value={field.title}
                      onChange={(e) => updateField(index, { title: e.target.value })}
                      placeholder="Field Title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => updateField(index, { 
                        type: value as FormField['type'],
                        choices: ['radiogroup', 'checkbox', 'dropdown'].includes(value) ? ['Option 1'] : [],
                        acceptedFileTypes: value === 'file' ? ['.pdf', '.jpg', '.jpeg', '.png', '.ppt', '.pptx', '.zip'] : []
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="comment">Text Area</SelectItem>
                        <SelectItem value="radiogroup">Radio Buttons</SelectItem>
                        <SelectItem value="checkbox">Checkboxes</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      checked={field.isRequired}
                      onChange={(e) => updateField(index, { isRequired: e.target.checked })}
                    />
                    <Label>Required</Label>
                  </div>
                </div>

                {/* Choices for radiogroup, checkbox, dropdown */}
                {(field.type === 'radiogroup' || field.type === 'checkbox' || field.type === 'dropdown') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Options</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addChoice(index)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.choices?.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="flex items-center gap-2">
                          <Input
                            value={choice}
                            onChange={(e) => updateChoice(index, choiceIndex, e.target.value)}
                            placeholder={`Option ${choiceIndex + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChoice(index, choiceIndex)}
                            disabled={field.choices!.length === 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File types for file upload */}
                {field.type === 'file' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Accepted File Types</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFileType(index)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Type
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {field.acceptedFileTypes?.map((fileType, typeIndex) => (
                        <div key={typeIndex} className="flex items-center gap-2">
                          <Input
                            value={fileType}
                            onChange={(e) => updateFileType(index, typeIndex, e.target.value)}
                            placeholder=".pdf, .jpg, etc."
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFileType(index, typeIndex)}
                            disabled={field.acceptedFileTypes!.length === 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Common types: .pdf, .jpg, .jpeg, .png, .gif, .ppt, .pptx, .doc, .docx, .zip, .rar
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}