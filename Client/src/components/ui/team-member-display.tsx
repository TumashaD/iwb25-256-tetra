import { useEffect, useState } from 'react'
import { TeamService, UserSearchResult } from '@/services/teamService'

interface TeamMemberDisplayProps {
  memberId: string
  role: string
  onRemove: () => void
}

export function TeamMemberDisplay({ memberId, role, onRemove }: TeamMemberDisplayProps) {
  const [user, setUser] = useState<UserSearchResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await TeamService.getUserDetails(memberId)
        setUser(userData)
      } catch (error) {
        console.error('Failed to fetch user details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [memberId])

  if (loading) {
    return (
      <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-600 rounded w-20"></div>
        </div>
        <button
          onClick={onRemove}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm transition-colors"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
      <div>
        <div className="font-medium">{user?.name || 'Unknown User'}</div>
        <div className="text-sm text-gray-400">
          {user?.email || memberId} • Role: {role}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm transition-colors"
      >
        Remove
      </button>
    </div>
  )
}
