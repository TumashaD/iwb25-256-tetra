import { apiCall } from '@/lib/api'

export interface Enrollment {
  enrollment_id: number
  competition_id: number
  team_id: number
  status: string
  created_at?: string
}

export interface EnrollmentWithDetails extends Enrollment {
  team_name?: string
  competition_title?: string
  competition_status?: string
  competition_start_date?: string
  competition_end_date?: string
}

export interface CreateEnrollmentData {
  competition_id: number
  team_id: number
  status: string
}

export const EnrollmentService = {
  // Create a new enrollment
  async createEnrollment(userId: string,data: CreateEnrollmentData): Promise<Enrollment> {
    try {
      console.log('EnrollmentService.createEnrollment called with data:', data)
      
      // Validate required fields on client side
      if (!data.competition_id || data.competition_id <= 0) {
        throw new Error('Valid competition ID is required')
      }
      if (!data.team_id || data.team_id <= 0) {
        throw new Error('Valid team ID is required')
      }
      if (!data.status?.trim()) {
        throw new Error('Status is required')
      }

      const result = await apiCall(`/enrollments/create/${userId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      console.log('EnrollmentService.createEnrollment API response:', result)
      return result
    } catch (error) {
      console.error('Failed to create enrollment:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('already enrolled') || error.message.includes('duplicate')) {
          throw new Error('This team is already enrolled in the competition')
        }
        if (error.message.includes('not found')) {
          throw new Error('Competition or team not found')
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          throw new Error('Please check your information and try again')
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again')
        }
        throw error
      }
      
      throw new Error('Failed to enroll team in competition. Please try again.')
    }
  },

  // Get enrollments for a user (all teams where user is member or leader)
  async getUserEnrollments(userId: string): Promise<EnrollmentWithDetails[]> {
    try {
      const result = await apiCall(`/enrollments/user/${userId}`, {
        method: 'GET',
      }) as EnrollmentWithDetails[]

      return result || []
    } catch (error) {
      console.error('Failed to get user enrollments:', error)
      throw new Error('Failed to fetch your enrollments. Please try again later.')
    }
  },

  // Get enrollments for a competition (for organizers)
  async getCompetitionEnrollments(competitionId: number): Promise<EnrollmentWithDetails[]> {
    try {
      const result = await apiCall(`/enrollments/competition/${competitionId}`, {
        method: 'GET',
      }) as EnrollmentWithDetails[]

      return result || []
    } catch (error) {
      console.error('Failed to get competition enrollments:', error)
      throw new Error('Failed to fetch competition enrollments. Please try again later.')
    }
  },

  // Get enrollment by team and competition
  async getTeamEnrollment(teamId: number, competitionId: number): Promise<Enrollment | null> {
    try {
      const result = await apiCall(`/enrollments/team/${teamId}/competition/${competitionId}`, {
        method: 'GET',
      }) as Enrollment

      return result
    } catch (error) {
      // If it's a 404 (enrollment not found), return null instead of throwing
      if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('Not Found') ||
        (error as any).status === 404
      )) {
        return null
      }
      
      console.error('Failed to get team enrollment:', error)
      throw error
    }
  },

  // Update enrollment status
  async updateEnrollmentStatus(enrollmentId: number, status: string): Promise<Enrollment> {
    try {
      console.log('EnrollmentService.updateEnrollmentStatus called:', { enrollmentId, status })
      
      if (!status?.trim()) {
        throw new Error('Status is required')
      }
      
      const result = await apiCall(`/enrollments/${enrollmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      
      console.log('EnrollmentService.updateEnrollmentStatus API response:', result)
      return result
    } catch (error) {
      console.error('Failed to update enrollment status:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error('Enrollment not found')
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('You do not have permission to update this enrollment')
        }
        throw error
      }
      
      throw new Error('Failed to update enrollment status. Please try again.')
    }
  },

  // Delete enrollment
  async deleteEnrollment(enrollmentId: number): Promise<void> {
    try {
      console.log('EnrollmentService.deleteEnrollment called:', { enrollmentId })
      
      await apiCall(`/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      })
      
      console.log('Enrollment deleted successfully')
    } catch (error) {
      console.error('Failed to delete enrollment:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new Error('Enrollment not found')
        }
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('You do not have permission to delete this enrollment')
        }
        throw error
      }
      
      throw new Error('Failed to delete enrollment. Please try again.')
    }
  }
}
