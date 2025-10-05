"use client"

import SimpleFormBuilder from "./SimpleFormBuilder"

interface FormBuilderProps {
  competitionId: number
  initialEventData?: any
  onSave?: (eventData: any) => void
  onCancel?: () => void
}

export default function FormBuilder({ competitionId, initialEventData, onSave, onCancel }: FormBuilderProps) {
  return (
    <SimpleFormBuilder
      competitionId={competitionId}
      initialEventData={initialEventData}
      onSave={onSave || (() => {})}
      onCancel={onCancel || (() => {})}
    />
  )
}