'use client'

import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useUser } from '@/contexts/UserContext'
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

export default function SignInPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { userProfile, loading: userLoading, createUserProfile, error: userError } = useUser()
  const router = useRouter()
  const [step, setStep] = React.useState<'login' | 'role' | 'details' | 'success'>('login')
  const [role, setRole] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [redirecting, setRedirecting] = React.useState(false)
  const [loadingTimeout, setLoadingTimeout] = React.useState(false)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading || userLoading) {
        setLoadingTimeout(true)
        setError('Loading is taking longer than expected. Please refresh the page.')
      }
    }, 15000) // 15 seconds timeout

    return () => clearTimeout(timer)
  }, [authLoading, userLoading])

  // Clear timeout when loading completes
  useEffect(() => {
    if (!authLoading && !userLoading) {
      setLoadingTimeout(false)
    }
  }, [authLoading, userLoading])

  // Handle user context errors
  useEffect(() => {
    if (userError) {
      setError(userError)
    }
  }, [userError])

  // Clear errors when step changes (but not user, as that might clear valid errors)
  useEffect(() => {
    setError(null)
  }, [step])

  // Optimized redirect logic with proper router usage
  const handleRedirectToHome = useCallback(() => {
    if (redirecting) return
    setRedirecting(true)
    router.push('/')
  }, [router, redirecting])

  // Handle authentication state changes
  useEffect(() => {
    // Skip if still loading or already redirecting
    if (authLoading || userLoading || redirecting) return

    console.log('Auth state - User:', !!user, 'Profile:', !!userProfile)
    
    // If user is authenticated and has profile, redirect to home
    if (user && userProfile) {
      handleRedirectToHome()
      return
    }
    
    // If user is authenticated but no profile, move to role selection
    if (user && !userProfile && step === 'login') {
      setStep('role')
    }
  }, [user, userProfile, authLoading, userLoading, step, handleRedirectToHome, redirecting])

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      await signInWithGoogle()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in"
      setError(errorMessage)
      console.error('Sign in error:', error)
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
  const [protectedGoogleSignIn, isSigningIn] = useSingleCall(handleGoogleSignIn)
  const [protectedProfileSubmission, isSubmittingProfile] = useSingleCall(handleProfileSubmission)

  // Update isSubmitting to reflect protected call states
  const actualIsSubmitting = isSubmitting || isSigningIn || isSubmittingProfile

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole)
    setError(null)
    setStep('details')
  }

  const retryOperation = () => {
    setError(null)
    setIsSubmitting(false)
  }

  const renderCurrentStep = () => {
    // Show loading if redirecting
    if (redirecting) {
      return <LoadingStep />
    }
    
    // Show loading during auth/user data fetch (with timeout check)
    if ((authLoading || userLoading) && !loadingTimeout) {
      return <LoadingStep />
    }
    
    // If user is authenticated and has profile, they shouldn't be here
    if (user && userProfile && !redirecting) {
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
            onGoogleSignIn={protectedGoogleSignIn} 
            isSubmitting={actualIsSubmitting}
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
            isSubmitting={actualIsSubmitting}
          />
        )
      
      case 'success':
        return (
          <SuccessStep 
            onContinue={handleRedirectToHome}
            isRedirecting={redirecting}
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
            className="w-full h-full object-cover"
          >
            <source src="/background.mp4" type="video/mp4" />
            <source src="/background.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
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
