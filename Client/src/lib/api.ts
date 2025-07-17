// API utility functions for communicating with Ballerina backend
import { createClient } from './supabase/client'

const API_BASE_URL = 'http://localhost:8080/api'

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
    window.location.href = '/login'
    return
  }

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
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

// API functions
export const api = {
  // Health check
  health: () => fetch(`${API_BASE_URL}/health`).then(res => res.json()),
  
  // Get authenticated user info
  getUser: () => apiCall('/user'),
  
  // Get competitions
  getCompetitions: () => apiCall('/competitions'),
  
  // Create competition
  createCompetition: (competition: { name: string; description: string; startDate?: string; endDate?: string }) =>
    apiCall('/competitions', {
      method: 'POST',
      body: JSON.stringify(competition),
    }),
}
