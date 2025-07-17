'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export default function APITester() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Check auth token when component mounts or user changes
  useEffect(() => {
    const checkAuthToken = async () => {
      if (user) {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          setAuthToken(session?.access_token || null)
          console.log('Current session:', session)
        } catch (error) {
          console.error('Error checking auth token:', error)
          setAuthToken(null)
        }
      } else {
        setAuthToken(null)
      }
    }
    
    checkAuthToken()
  }, [user])

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [name]: true }))
    try {
      const result = await apiCall()
      setResults((prev: any) => ({ ...prev, [name]: result }))
    } catch (error: any) {
      setResults((prev: any) => ({ ...prev, [name]: { error: error.message } }))
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }))
    }
  }


  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please sign in to test API endpoints</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">API Integration Test</h3>
      
      {/* Authentication Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Authentication Status:</h4>
        <div className="text-sm space-y-1">
          <p><strong>User:</strong> {user ? user.email : 'Not signed in'}</p>
          <p><strong>Auth Token:</strong> {authToken ? `${authToken.substring(0, 20)}...` : 'No token available'}</p>
        </div>
      </div>
      
      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => testEndpoint('health', api.health)}
          disabled={loading.health}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading.health ? 'Testing...' : 'Test Health'}
        </button>
        
        <button
          onClick={() => testEndpoint('user', api.getUser)}
          disabled={loading.user}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading.user ? 'Testing...' : 'Test User Auth'}
        </button>
        
        <button
          onClick={() => testEndpoint('competitions', api.getCompetitions)}
          disabled={loading.competitions}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading.competitions ? 'Testing...' : 'Get Competitions'}
        </button>
      </div>

      {/* Results Display */}
      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]) => (
          <div key={endpoint} className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2 capitalize">
              {endpoint} Response:
            </h4>
            <pre className="bg-gray-100 rounded p-3 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
