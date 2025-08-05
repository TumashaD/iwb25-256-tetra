// API utility functions for communicating with Ballerina backend
import { createClient } from './supabase/client'

const API_BASE_URL = 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Get the current user's JWT token
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    // Try to refresh
    const { data: refreshData } = await supabase.auth.refreshSession()
    return refreshData.session?.access_token || null
  }
  
  return session.access_token
}

// Generic API call function with authentication
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken()
  
  if (!token) {
    throw new ApiError('No authentication token available', 401, 'Unauthorized')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new ApiError(
        `API call failed: ${errorText || response.statusText}`,
        response.status,
        response.statusText
      )
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    
    return response.text()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      'Network Error'
    )
  }
}

export { apiCall, getAuthToken }