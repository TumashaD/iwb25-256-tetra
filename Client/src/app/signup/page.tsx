'use client'

import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// Import step components
import { LoginStep } from '@/components/auth/LoginStep'
import { RoleStep } from '@/components/auth/RoleStep'
import { DetailsStep } from '@/components/auth/DetailsStep'
import { SuccessStep } from '@/components/auth/SuccessStep'
import { LoadingStep } from '@/components/auth/LoadingStep'
import { ErrorBoundary } from '@/components/auth/ErrorBoundary'
import { useSingleCall } from '@/hooks/useCallProtection'

export default function SignUpPage() {
  const { 
    user, 
    loading,
    signUpWithGoogle, 
    createUserProfile, 
    error: userError 
  } = useAuth()
  const router = useRouter()
  const [step, setStep] = React.useState<'login' | 'role' | 'details' | 'success'>('login')
  const [role, setRole] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Handle user context errors
  useEffect(() => {
    if (userError) {
      setError(userError)
    }
  }, [userError])

  // Clear errors when step changes
  useEffect(() => {
    setError(null)
  }, [step])

  // Redirect to home when user is fully authenticated
  const handleRedirectToHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Handle authentication state changes
  useEffect(() => {
    // Skip if still loading
    if (loading) return

    // If user is authenticated and has profile, redirect to home
    if (user?.isAuthenticated && user.profile) {
      handleRedirectToHome()
      return
    }
    
    // If user is authenticated but no profile, move to role selection
    if (user?.isAuthenticated && !user.profile && step === 'login') {
      setStep('role')
    }
  }, [user, loading, step, handleRedirectToHome])

  const handleGoogleSignUp = async () => {
    try {
      setError(null)
      await signUpWithGoogle()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign up"
      setError(errorMessage)
      console.error('Sign up error:', error)
    }
  }

  const handleProfileSubmission = async (userData: any) => {
    if (!role) return
    
    setError(null)
    
    try {
      // Validate required fields
      if (!userData.name?.trim()) {
        throw new Error("Name is required")
      }
      
      if (!userData.email?.trim()) {
        throw new Error("Email is required") 
      }

      // Use the createUserProfile from useUser context
      await createUserProfile({
        ...userData,
        role,
      })
      setStep('success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile"
      setError(errorMessage)
      console.error('Profile creation error:', error)
    }
  }

  // Apply single call protection to prevent rapid successive calls
  const [protectedGoogleSignUp, isSigningUp] = useSingleCall(handleGoogleSignUp)
  const [protectedProfileSubmission, isSubmittingProfile] = useSingleCall(handleProfileSubmission)

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole)
    setError(null)
    setStep('details')
  }

  const retryOperation = () => {
    setError(null)
  }

  const renderCurrentStep = () => {
    // Show loading during auth/user data fetch
    if (loading) {
      return <LoadingStep />
    }
    
    // If user is authenticated and has profile, they shouldn't be here
    if (user?.isAuthenticated && user.profile) {
      return <LoadingStep />
    }

    // Show error state with retry option
    if (error) {
      return (
        <div className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={retryOperation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }
    
    switch (step) {
      case 'login':
        return (
          <LoginStep 
            onGoogleSignUp={protectedGoogleSignUp} 
            isSubmitting={isSigningUp}
          />
        )
      
      case 'role':
        return (
          <RoleStep 
            onRoleSelect={handleRoleSelection}
          />
        )
      
      case 'details':
        if (!user) return <LoadingStep />
        return (
          <DetailsStep 
            user={user}
            role={role || ''}
            onSubmit={protectedProfileSubmission}
            onBack={() => setStep('role')}
            isSubmitting={isSubmittingProfile}
          />
        )
      
      case 'success':
        return (
          <SuccessStep 
            onContinue={handleRedirectToHome}
          />
        )
      
      default:
        return <LoadingStep />
    }
  }

  return (
    <ErrorBoundary>
      <div className={cn("flex w-full flex-col min-h-screen bg-white relative")}>
        {/* Video Background */}
        <div className="absolute inset-0 z-0 opacity-80">
          <video
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            style={{ userSelect: 'none' }}
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src="/background.mp4" type="video/mp4" />
            <source src="/background.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
          {/* Fallback image */}
          <img src="/background.png" alt="Fallback" className="absolute inset-0 w-full h-full object-cover" />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
        
        {/* Content Layer */}
        <div className="relative z-10 flex flex-col flex-1">
          <div className="flex flex-1 flex-col lg:flex-row">
            {/* Main content container */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="w-full max-w-fit mt-20">
                <AnimatePresence mode="wait">
                  {renderCurrentStep()}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
