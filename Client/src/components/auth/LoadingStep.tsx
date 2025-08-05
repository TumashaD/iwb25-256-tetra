import React from 'react'

interface LoadingStepProps {
  message?: string
}

export function LoadingStep({}: LoadingStepProps) {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
    </div>
  )
}
