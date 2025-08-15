'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { TeamService, Team, TeamWithMembers, UserSearchResult, CreateTeamData, AddMemberData } from '@/services/teamService'
import { UserService, Profile } from '@/services/userService'
import { Navbar } from '@/components/ui/navbar'

interface TeamMemberWithProfile {
  team_id: number
  member_id: string
  role: string
  created_at?: string
  last_modified?: string
  profile?: Profile
}

export default function CompetitorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([])
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [teamFormData, setTeamFormData] = useState<CreateTeamData>({
    name: '',
    created_by: '',
    no_participants: 1
  })
  const [memberFormData, setMemberFormData] = useState<AddMemberData>({
    member_id: '',
    role: 'member'
  })
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentUserLeader, setIsCurrentUserLeader] = useState(false)
  const [teamCreatorProfile, setTeamCreatorProfile] = useState<Profile | null>(null)

  // Redirect if not competitor
  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'competitor')) {
      router.push('/')
    }
  }, [user, loading, router])

  // Set user ID when user is loaded
  useEffect(() => {
    if (user?.id) {
      setTeamFormData(prev => ({ ...prev, created_by: user.id }))
    }
  }, [user?.id])

  // Fetch competitor's teams
  useEffect(() => {
    if (user?.profile?.role === 'competitor') {
      fetchMyTeams()
    }
  }, [user])

  const fetchMyTeams = async () => {
    try {
      setPageLoading(true)
      setError(null)
      if (user?.id) {
        const userTeams = await TeamService.getAllUserTeams(user.id)
        setTeams(userTeams)
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      setError('Failed to fetch teams. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: number) => {
    try {
      const teamDetails = await TeamService.getTeam(teamId)
      setSelectedTeam(teamDetails)
      
      // Check if current user is a team leader (either in members list or is the creator)
      const currentUserIsLeader = (
        teamDetails?.members?.some(
          member => member.member_id === user?.id && member.role === 'leader'
        ) || teamDetails?.created_by === user?.id
      ) || false
      
      console.log('Team details:', teamDetails)
      console.log('Current user ID:', user?.id)
      console.log('Team creator:', teamDetails?.created_by)
      console.log('Team members:', teamDetails?.members)
      console.log('Is current user leader:', currentUserIsLeader)
      
      setIsCurrentUserLeader(currentUserIsLeader)
      
      // Fetch team creator's profile
      if (teamDetails?.created_by) {
        try {
          const creatorProfile = await UserService.getUser(teamDetails.created_by)
          setTeamCreatorProfile(creatorProfile)
        } catch (error) {
          console.error('Failed to fetch team creator profile:', error)
          setTeamCreatorProfile(null)
        }
      }
      
      // Fetch member profiles
      if (teamDetails?.members) {
        const membersWithProfiles = await Promise.all(
          teamDetails.members.map(async (member) => {
            try {
              const profile = await UserService.getUser(member.member_id)
              return {
                ...member,
                profile: profile || undefined
              }
            } catch (error) {
              console.error(`Failed to fetch profile for member ${member.member_id}:`, error)
              return member
            }
          })
        )
        setTeamMembers(membersWithProfiles)
      } else {
        setTeamMembers([])
      }
    } catch (error) {
      console.error('Failed to fetch team details:', error)
      setError('Failed to fetch team details.')
    }
  }

  const searchUsers = async (email: string) => {
    if (!email.trim()) {
      setSearchResults([])
      return
    }
    
    try {
      const results = await TeamService.searchUsers(email)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search users:', error)
      setSearchResults([])
    }
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setPageLoading(true)
      setError(null)
      
      await TeamService.createTeam(teamFormData)
      
      // Reset form and refresh teams
      resetTeamForm()
      fetchMyTeams()
    } catch (error) {
      console.error('Failed to create team:', error)
      setError('Failed to create team. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    
    try {
      setPageLoading(true)
      setError(null)
      
      await TeamService.addTeamMember(selectedTeam.id, memberFormData)
      
      // Reset form and refresh team details
      resetMemberForm()
      fetchTeamDetails(selectedTeam.id)
    } catch (error) {
      console.error('Failed to add team member:', error)
      setError('Failed to add team member. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const handleRemoveMember = async (teamId: number, memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      try {
        await TeamService.removeTeamMember(teamId, memberId)
        fetchTeamDetails(teamId)
      } catch (error) {
        console.error('Failed to remove team member:', error)
        setError('Failed to remove team member. Please try again.')
      }
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone and will remove all team members.')) {
      try {
        setPageLoading(true)
        setError(null)
        
        await TeamService.deleteTeam(teamId)
        
        // Reset team selection and refresh teams list
        resetTeamSelection()
        fetchMyTeams()
      } catch (error) {
        console.error('Failed to delete team:', error)
        setError('Failed to delete team. Please try again.')
      } finally {
        setPageLoading(false)
      }
    }
  }

  const resetTeamForm = () => {
    setTeamFormData({
      name: '',
      created_by: user?.id || '',
      no_participants: 1
    })
    setShowTeamForm(false)
  }

  const resetMemberForm = () => {
    setMemberFormData({
      member_id: '',
      role: 'member'
    })
    setShowAddMemberForm(false)
    setSearchEmail('')
    setSearchResults([])
  }

  const resetTeamSelection = () => {
    setSelectedTeam(null)
    setTeamMembers([])
    setTeamCreatorProfile(null)
    setIsCurrentUserLeader(false)
  }

  const selectUserForTeam = (user: UserSearchResult) => {
    setMemberFormData(prev => ({ ...prev, member_id: user.id }))
    setSearchEmail(user.email)
    setSearchResults([])
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (!user || user.profile?.role !== 'competitor') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Competitor Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTeamForm(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Create Team
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Create Team Form */}
        {showTeamForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Team</h2>
              
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Team Name"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                />
                
                <input
                  type="number"
                  placeholder="Number of Participants"
                  value={teamFormData.no_participants}
                  onChange={(e) => setTeamFormData({ ...teamFormData, no_participants: parseInt(e.target.value) || 1 })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  min="1"
                  required
                />
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create Team'}
                  </button>
                  <button
                    type="button"
                    onClick={resetTeamForm}
                    disabled={loading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Form */}
        {showAddMemberForm && selectedTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
              <p className="text-sm text-gray-400 mb-4">Search for a user by email to add them as a team member.</p>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value)
                      searchUsers(e.target.value)
                    }}
                    className="w-full p-3 bg-gray-700 rounded-lg"
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectUserForTeam(user)}
                          className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                        >
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !memberFormData.member_id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={resetMemberForm}
                    disabled={loading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teams Management */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Teams List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">My Teams</h2>
            <p className="text-sm text-gray-400 mb-4">All teams where you are either the creator or a member</p>
            {teams.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No teams yet. Create your first team or get added to an existing team!
              </p>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className={`bg-gray-800 p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-750'
                    }`}
                    onClick={() => fetchTeamDetails(team.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{team.name}</h3>
                      {team.created_by === user?.id ? (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Creator</span>
                      ) : (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Member</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Max Participants: {team.no_participants}</div>
                      <div>Created: {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Details */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Team Details</h2>
            {selectedTeam ? (
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{selectedTeam.name}</h3>
                    {isCurrentUserLeader && (
                      <button
                        onClick={() => handleDeleteTeam(selectedTeam.id)}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
                        title="Delete Team"
                      >
                        Delete Team
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>Max Participants: {selectedTeam.no_participants}</div>
                    <div>Current Members: {teamMembers.length}</div>
                    <div>Created: {selectedTeam.created_at ? new Date(selectedTeam.created_at).toLocaleDateString() : 'N/A'}</div>
                    {/* Debug info - remove this later */}
                    <div className="text-xs text-yellow-400 mt-2">
                      Debug: You are {isCurrentUserLeader ? 'a team leader' : 'not a team leader'} | 
                      Your ID: {user?.id} | Creator ID: {selectedTeam.created_by}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">Team Members</h4>
                    {isCurrentUserLeader && (
                      <button
                        onClick={() => setShowAddMemberForm(true)}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>
                  
                  {/* Always show team creator first */}
                  {selectedTeam.created_by && teamCreatorProfile && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center bg-blue-900/30 p-3 rounded border border-blue-700">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {teamCreatorProfile.name}
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Creator</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {teamCreatorProfile.email}
                          </div>
                          <div className="text-sm text-blue-400 font-medium">Role: Team Leader</div>
                        </div>
                        {/* Team creator cannot be removed */}
                        <div className="text-xs text-gray-500">Cannot be removed</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show other team members */}
                  {teamMembers.filter(member => member.member_id !== selectedTeam.created_by).length > 0 ? (
                    <div className="space-y-2">
                      {teamMembers
                        .filter(member => member.member_id !== selectedTeam.created_by)
                        .map((member) => (
                        <div key={member.member_id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                          <div>
                            <div className="font-medium">
                              {member.profile?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {member.profile?.email || member.member_id}
                            </div>
                            <div className="text-sm text-gray-500">
                              Role: {member.role === 'leader' ? 'Team Leader' : 'Member'}
                            </div>
                          </div>
                          {isCurrentUserLeader && (
                            <button
                              onClick={() => handleRemoveMember(selectedTeam.id, member.member_id)}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    teamMembers.length === 0 && !teamCreatorProfile && (
                      <p className="text-gray-400">No members yet. Add some members to get started!</p>
                    )
                  )}
                  
                  {/* Show message if only creator exists */}
                  {teamMembers.filter(member => member.member_id !== selectedTeam.created_by).length === 0 && teamCreatorProfile && (
                    <p className="text-gray-400 text-sm mt-2">No additional members yet. Add some members to get started!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
                Select a team to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
