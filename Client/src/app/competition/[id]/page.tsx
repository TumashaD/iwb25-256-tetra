'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Competition, CompetitionsService } from '@/services/competitionService'
import { Team, TeamService } from '@/services/teamService'
import { EnrollmentService, Enrollment } from '@/services/enrollmentService'
import { Navbar } from '@/components/ui/navbar'
import { useAuth } from '@/contexts/AuthContext'

const themeStyles = {
  default: {
    background: 'bg-gradient-to-br from-gray-900 to-gray-800',
    card: 'bg-gray-800',
    accent: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  modern: {
    background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    card: 'bg-slate-800/50 backdrop-blur-sm',
    accent: 'text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700'
  },
  minimal: {
    background: 'bg-gradient-to-br from-white to-gray-100',
    card: 'bg-white shadow-lg',
    accent: 'text-gray-900',
    button: 'bg-gray-900 hover:bg-gray-800'
  },
  gaming: {
    background: 'bg-gradient-to-br from-green-900 via-black to-green-900',
    card: 'bg-green-900/30 border border-green-500/30',
    accent: 'text-green-400',
    button: 'bg-green-600 hover:bg-green-700'
  }
}

export default function CompetitionLandingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Enrollment related state
  const [userTeams, setUserTeams] = useState<Team[]>([])
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [existingEnrollment, setExistingEnrollment] = useState<Enrollment | null>(null)
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false)
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    no_participants: 1
  })

  const competitionId = params.id as string

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true)
        setError(null)
        const comp = await CompetitionsService.getCompetition(parseInt(competitionId))
        setCompetition(comp)
      } catch (error) {
        console.error('Failed to fetch competition:', error)
        setError('Failed to load competition. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (competitionId) {
      fetchCompetition()
    }
  }, [competitionId])

  // Fetch user teams when user is authenticated and competition is loaded
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (user?.id && user.profile?.role === 'competitor' && competition) {
        try {
          const teams = await TeamService.getAllUserTeams(user.id)
          setUserTeams(teams)
          
          // Check if any team is already enrolled
          if (teams.length > 0) {
            for (const team of teams) {
              const enrollment = await EnrollmentService.getTeamEnrollment(team.id, parseInt(competitionId))
              if (enrollment) {
                setExistingEnrollment(enrollment)
                setSelectedTeamId(team.id)
                break
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch user teams or enrollment status:', error)
        }
      }
    }

    fetchUserTeams()
  }, [user, competition, competitionId])

  const handleEnrollTeam = async () => {
    if (!selectedTeamId || !competition) return

    try {
      setEnrollmentLoading(true)
      setError(null)

      await EnrollmentService.createEnrollment(user?.id!, {
        competition_id: competition.id,
        team_id: selectedTeamId,
        status: 'enrolled'
      })

      // Refresh enrollment status
      const enrollment = await EnrollmentService.getTeamEnrollment(selectedTeamId, competition.id)
      setExistingEnrollment(enrollment)
      setShowEnrollmentModal(false)
      
      alert('Successfully enrolled in the competition!')
    } catch (error) {
      console.error('Failed to enroll team:', error)
      setError(error instanceof Error ? error.message : 'Failed to enroll team. Please try again.')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  const handleCreateAndEnrollTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !competition) return

    try {
      setEnrollmentLoading(true)
      setError(null)

      // Create the team first
      const newTeam = await TeamService.createTeam({
        name: newTeamData.name,
        created_by: user.id,
        no_participants: newTeamData.no_participants
      })

      // Then enroll the team
      const enrollment = await EnrollmentService.createEnrollment(user?.id!, {
        competition_id: competition.id,
        team_id: newTeam.id,
        status: 'enrolled'
      })

      // Update state
      setUserTeams(prev => [...prev, newTeam])
      setSelectedTeamId(newTeam.id)
      setExistingEnrollment(enrollment)
      setShowCreateTeamForm(false)
      setShowEnrollmentModal(false)
      setNewTeamData({ name: '', no_participants: 1 })
      
      alert('Team created and successfully enrolled in the competition!')
    } catch (error) {
      console.error('Failed to create team and enroll:', error)
      setError(error instanceof Error ? error.message : 'Failed to create team and enroll. Please try again.')
    } finally {
      setEnrollmentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading competition...</div>
        </div>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Competition Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The competition you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const theme = themeStyles[competition.landing_page_theme || 'default']
  const isMinimalTheme = competition.landing_page_theme === 'minimal'
  const textColor = isMinimalTheme ? 'text-gray-900' : 'text-white'
  const mutedTextColor = isMinimalTheme ? 'text-gray-600' : 'text-gray-300'

  const getBannerUrl = () => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competitions/${competition.id}/banner?t=${new Date(competition.updated_at).getTime()}`
  }

  const handleJoinCompetition = () => {
    if (!user) {
      router.push('/signup')
      return
    }
    
    if (user.profile?.role !== 'competitor') {
      setError('Only competitors can join competitions')
      return
    }

    // Show enrollment modal
    setShowEnrollmentModal(true)
  }

  return (
    <div className={`min-h-screen ${theme.background} ${textColor}`}>
      <Navbar />
      
      {/* Error Display */}
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-200 px-6 py-3 rounded-lg z-50 max-w-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 ml-4"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-white">Join Competition</h2>
            
            {existingEnrollment ? (
              <div className="text-center">
                <div className="text-green-400 text-lg mb-4">✓</div>
                <p className="text-white mb-4">
                  You are already enrolled in this competition with{' '}
                  <span className="font-semibold">
                    {userTeams.find(t => t.id === selectedTeamId)?.name || 'your team'}
                  </span>
                </p>
                <button
                  onClick={() => setShowEnrollmentModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-white"
                >
                  Close
                </button>
              </div>
            ) : userTeams.length > 0 ? (
              <div>
                <p className="text-gray-300 mb-4">Select a team to enroll:</p>
                <div className="space-y-2 mb-4">
                  {userTeams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTeamId === team.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{team.name}</div>
                      <div className="text-sm opacity-80">
                        Max participants: {team.no_participants}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mb-4">
                  <button
                    onClick={() => setShowCreateTeamForm(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Or create a new team
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleEnrollTeam}
                    disabled={!selectedTeamId || enrollmentLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors text-white"
                  >
                    {enrollmentLoading ? 'Enrolling...' : 'Enroll Team'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEnrollmentModal(false)
                      setSelectedTeamId(null)
                    }}
                    disabled={enrollmentLoading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 px-4 py-2 rounded-lg transition-colors text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  You need to create a team first to join this competition.
                </p>
                <button
                  onClick={() => setShowCreateTeamForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white mb-2"
                >
                  Create Team
                </button>
                <div>
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Form Modal */}
      {showCreateTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4 text-white">Create New Team</h2>
            
            <form onSubmit={handleCreateAndEnrollTeam} className="space-y-4">
              <input
                type="text"
                placeholder="Team Name"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                className="w-full p-3 bg-gray-700 rounded-lg text-white"
                required
              />
              
              <input
                type="number"
                placeholder="Number of Participants"
                value={newTeamData.no_participants}
                onChange={(e) => setNewTeamData({ ...newTeamData, no_participants: parseInt(e.target.value) || 1 })}
                className="w-full p-3 bg-gray-700 rounded-lg text-white"
                min="1"
                required
              />
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enrollmentLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg transition-colors text-white"
                >
                  {enrollmentLoading ? 'Creating & Enrolling...' : 'Create & Enroll'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTeamForm(false)
                    setNewTeamData({ name: '', no_participants: 1 })
                  }}
                  disabled={enrollmentLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 p-3 rounded-lg transition-colors text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className={`${theme.card} rounded-xl overflow-hidden mb-8`}>
          {/* Banner Image */}
          <div className="relative h-64 md:h-96">
            <img
              src={getBannerUrl()}
              alt={competition.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI0NSUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Q0EzQUYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgQ29tcGV0aXRpb24gQmFubmVyCiAgPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNjAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPgogICAgVXBsb2FkIGEgYmFubmVyIGltYWdlIHRvIGN1c3RvbWl6ZSB0aGlzIHNwYWNlCiAgPC90ZXh0Pgo8L3N2Zz4='
              }}
            />
            <div className="absolute inset-0 bg-black/50 flex items-end">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    competition.status === 'active' ? 'bg-green-500/80 text-white' :
                    competition.status === 'upcoming' ? 'bg-blue-500/80 text-white' :
                    competition.status === 'completed' ? 'bg-gray-500/80 text-white' :
                    'bg-red-500/80 text-white'
                  }`}>
                    {competition.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-white bg-black/40 px-2 py-1 rounded">
                    {competition.category}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  {competition.title}
                </h1>
                <p className="text-gray-200 text-lg max-w-2xl">
                  {competition.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Competition Details */}
            <div className={`${theme.card} p-6 rounded-xl`}>
              <h2 className={`text-2xl font-bold mb-4 ${theme.accent}`}>Competition Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Start Date</h3>
                  <p className={mutedTextColor}>
                    {new Date(competition.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">End Date</h3>
                  <p className={mutedTextColor}>
                    {new Date(competition.end_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Landing Page Content */}
            {competition.landing_page_content && (
              <div className={`${theme.card} p-6 rounded-xl`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.accent}`}>About This Competition</h2>
                <div 
                  className={`prose ${isMinimalTheme ? 'prose-gray' : 'prose-invert'} max-w-none`}
                  dangerouslySetInnerHTML={{ __html: competition.landing_page_content }}
                />
              </div>
            )}

            {/* Rules */}
            {competition.rules && (
              <div className={`${theme.card} p-6 rounded-xl`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.accent}`}>Rules & Guidelines</h2>
                <div 
                  className={`prose ${isMinimalTheme ? 'prose-gray' : 'prose-invert'} max-w-none`}
                  dangerouslySetInnerHTML={{ __html: competition.rules }}
                />
              </div>
            )}

            

            {/* Prizes */}
            {competition.prizes && (
              <div className={`${theme.card} p-6 rounded-xl`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.accent}`}>Prizes & Rewards</h2>
                <div 
                  className={`prose ${isMinimalTheme ? 'prose-gray' : 'prose-invert'} max-w-none`}
                  dangerouslySetInnerHTML={{ __html: competition.prizes }}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className={`${theme.card} p-6 rounded-xl`}>
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-2 ${theme.accent}`}>Ready to Compete?</h3>
                <p className={`text-sm ${mutedTextColor}`}>
                  {competition.status === 'active' ? 'Competition is currently active!' :
                   competition.status === 'upcoming' ? 'Registration is open!' :
                   competition.status === 'completed' ? 'Competition has ended.' :
                   'Registration is closed.'}
                </p>
              </div>
              
              <button
                onClick={handleJoinCompetition}
                disabled={competition.status === 'completed' || competition.status === 'cancelled'}
                className={`w-full ${theme.button} disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors font-semibold`}
              >
                {!user ? 'Sign Up to Join' :
                 user.profile?.role !== 'competitor' ? 'For Competitors Only' :
                 existingEnrollment ? 'Already Enrolled' :
                 competition.status === 'active' ? 'Join Competition' :
                 competition.status === 'upcoming' ? 'Register Now' :
                 competition.status === 'completed' ? 'View Results' :
                 'Competition Ended'}
              </button>
            </div>

            {/* Competition Stats */}
            <div className={`${theme.card} p-6 rounded-xl`}>
              <h3 className={`text-lg font-bold mb-4 ${theme.accent}`}>Competition Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={mutedTextColor}>Category</span>
                  <span className="font-medium">{competition.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedTextColor}>Status</span>
                  <span className={`font-medium ${
                    competition.status === 'active' ? 'text-green-500' :
                    competition.status === 'upcoming' ? 'text-blue-500' :
                    competition.status === 'completed' ? 'text-gray-500' :
                    'text-red-500'
                  }`}>
                    {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={mutedTextColor}>Created</span>
                  <span className="font-medium">
                    {new Date(competition.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {competition.contact_info && (
              <div className={`${theme.card} p-6 rounded-xl`}>
                <h3 className={`text-lg font-bold mb-4 ${theme.accent}`}>Contact Information</h3>
                <div 
                  className={`prose ${isMinimalTheme ? 'prose-gray' : 'prose-invert'} prose-sm max-w-none`}
                  dangerouslySetInnerHTML={{ __html: competition.contact_info }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
