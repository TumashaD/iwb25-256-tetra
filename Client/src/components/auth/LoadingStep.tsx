import { Loader2 } from 'lucide-react'
import React from 'react'

interface LoadingStepProps {
  message?: string
}

export function LoadingStep({}: LoadingStepProps) {
  return (
    <div className="text-center">
      <Loader2 className="h-10 w-10 text-white animate-spin mx-auto" />
    </div>
  )
}
