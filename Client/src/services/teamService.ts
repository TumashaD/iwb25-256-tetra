import { apiCall } from '@/lib/api'

export interface Team {
  id: number
  name: string
  created_by: string
  no_participants: number
  created_at?: string
  last_modified?: string
}

export interface TeamMember {
  team_id: number
  member_id: string
  role: string
  created_at?: string
  last_modified?: string
}

export interface TeamWithMembers extends Team {
  members?: TeamMember[]
}

export interface UserSearchResult {
  id: string
  name: string
  email: string
  role: string
}

export interface CreateTeamData {
  name: string
  created_by: string
  no_participants: number
}

export interface AddMemberData {
  member_id: string
  role: string
}

export const TeamService = {
  // Create a new team
  // Note: The team creator is automatically added as the team leader by the backend
  async createTeam(data: CreateTeamData): Promise<Team> {
    try {
      console.log('TeamService.createTeam called with data:', data)
      
      // Validate required fields on client side
      if (!data.name?.trim()) {
        throw new Error('Team name is required')
      }
      if (!data.created_by?.trim()) {
        throw new Error('Creator ID is required')
      }
      if (!data.no_participants || data.no_participants < 1) {
        throw new Error('Number of participants must be at least 1')
      }
      
      const result = await apiCall('/teams/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      console.log('TeamService.createTeam API response:', result)
      return result
    } catch (error) {
      console.error('Failed to create team:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          throw new Error('A team with this name already exists')
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          throw new Error('Please check your information and try again')
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again')
        }
        throw error
      }
      
      throw new Error('Failed to create team. Please try again.')
    }
  },

  // Get team by ID with members
  async getTeam(teamId: number): Promise<TeamWithMembers | null> {
    try {
      const result = await apiCall(`/teams/${teamId}`, {
        method: 'GET',
      }) as TeamWithMembers

      return result
    } catch (error) {
      // If it's a 404 (team not found), return null instead of throwing
      if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('Not Found') ||
        (error as any).status === 404
      )) {
        return null
      }
      
      console.error('Failed to get team:', error)
      throw error
    }
  },

  // Get teams created by a specific user
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const result = await apiCall(`/teams/user/${userId}`, {
        method: 'GET',
      }) as Team[]

      return result || []
    } catch (error) {
      console.error('Failed to get user teams:', error)
      throw new Error('Failed to fetch your teams. Please try again later.')
    }
  },

  // Get all teams where user is either creator or member
  async getAllUserTeams(userId: string): Promise<Team[]> {
    try {
      const result = await apiCall(`/teams/user/${userId}/all`, {
        method: 'GET',
      }) as Team[]

      return result || []
    } catch (error) {
      console.error('Failed to get all user teams:', error)
      throw new Error('Failed to fetch your teams. Please try again later.')
    }
  },

  // Add a member to a team
  // Note: All added members have the 'member' role by default. Only team creators are leaders.
  async addTeamMember(teamId: number, memberData: AddMemberData): Promise<TeamMember> {
    try {
      console.log('TeamService.addTeamMember called:', { teamId, memberData })
      
      // Validate required fields
      if (!memberData.member_id?.trim()) {
        throw new Error('Member ID is required')
      }
      if (!memberData.role?.trim()) {
        throw new Error('Member role is required')
      }
      
      const result = await apiCall(`/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData),
      })
      
      console.log('TeamService.addTeamMember API response:', result)
      return result
    } catch (error) {
      console.error('Failed to add team member:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          throw new Error('This user is already a member of the team')
        }
        if (error.message.includes('not found')) {
          throw new Error('Team or user not found')
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Only team leaders can add members to the team')
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          throw new Error('Please check the information and try again')
        }
        throw error
      }
      
      throw new Error('Failed to add team member. Please try again.')
    }
  },

  // Remove a member from a team
  async removeTeamMember(teamId: number, memberId: string): Promise<void> {
    try {
      console.log('TeamService.removeTeamMember called:', { teamId, memberId })
      
      await apiCall(`/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      })
      
      console.log('TeamService.removeTeamMember successful')
    } catch (error) {
      console.error('Failed to remove team member:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error('Team member not found')
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Only team leaders can remove members from the team')
        }
        throw error
      }
      
      throw new Error('Failed to remove team member. Please try again.')
    }
  },

  // Search users by email for adding to team
  async searchUsers(email: string): Promise<UserSearchResult[]> {
    try {
      if (!email?.trim()) {
        return []
      }
      
      const result = await apiCall(`/teams/users/search?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      }) as UserSearchResult[]

      return result || []
    } catch (error) {
      console.error('Failed to search users:', error)
      
      // Don't throw for search failures, just return empty array
      return []
    }
  },

  // Get user details for team members
  async getUserDetails(userId: string): Promise<UserSearchResult | null> {
    try {
      // We can reuse the user service here or create a simpler endpoint
      const result = await apiCall(`/users/${userId}`, {
        method: 'GET',
      })

      if (result) {
        return {
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get user details:', error)
      return null
    }
  },

  // Delete a team (only team creators or team leaders can delete)
  async deleteTeam(teamId: number): Promise<void> {
    try {
      console.log('TeamService.deleteTeam called:', { teamId })
      
      await apiCall(`/teams/${teamId}`, {
        method: 'DELETE',
      })
      
      console.log('Team deleted successfully')
    } catch (error) {
      console.error('Failed to delete team:', error)
      throw new Error('Failed to delete team. Please try again.')
    }
  }
}
