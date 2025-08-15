'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to home
        router.push('/')
        return
      }

      // Redirect based on user role
      if (user.profile?.role === 'organizer') {
        router.push('/dashboard/organizer')
      } else if (user.profile?.role === 'competitor') {
        router.push('/dashboard/competitor')
      } else {
        // Unknown role, redirect to home
        router.push('/')
      }
    }
  }, [user, loading, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div>Redirecting to your dashboard...</div>
      </div>
    </div>
  )
}
