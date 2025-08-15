'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CompetitionsService, Competition } from '@/services/competitionService'
import { EnrollmentService, EnrollmentWithDetails } from '@/services/enrollmentService'
import { Navbar } from '@/components/ui/navbar'
import { OrganizerService } from '@/services/organizerService'

export default function OrganizerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [competitionEnrollments, setCompetitionEnrollments] = useState<EnrollmentWithDetails[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: '',
    description: '',
    organizer_id: '',
    start_date: '',
    end_date: '',
    category: '',
    status: 'upcoming',
    landing_page_content: '',
    landing_page_theme: 'default',
    rules: '',
    prizes: '',
    contact_info: ''
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedBanners, setUploadedBanners] = useState<Record<number, string>>({})
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  // Redirect if not organizer
  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'organizer')) {
      router.push('/')
    }
  }, [user, loading, router])

  // Set organizer_id when user is loaded
  useEffect(() => {
    if (user?.id) {
      setFormData(prev => ({ ...prev, organizer_id: user.id }))
    }
  }, [user?.id])

  // Fetch organizer's competitions
  useEffect(() => {
    if (user?.profile?.role === 'organizer') {
      fetchMyCompetitions()
    }
  }, [user])

  const fetchMyCompetitions = async () => {
    try {
      setPageLoading(true)
      setError(null)
      const allCompetitions = await CompetitionsService.getCompetitions()
      // Filter competitions by organizer_id
      const myCompetitions = allCompetitions.filter(comp => comp.organizer_id === user?.id)
      setCompetitions(myCompetitions)
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
      setError('Failed to fetch competitions. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const fetchCompetitionEnrollments = async (competition: Competition) => {
    try {
      setSelectedCompetition(competition)
      setError(null)
      const enrollments = await EnrollmentService.getCompetitionEnrollments(competition.id)
      setCompetitionEnrollments(enrollments)
      setShowEnrollmentModal(true)
    } catch (error) {
      console.error('Failed to fetch competition enrollments:', error)
      setError('Failed to fetch enrollments. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setPageLoading(true)
      setError(null)
      
      if (editingCompetition) {
        // Update existing competition
        const updateData: Partial<Competition> = {
          title: formData.title,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          category: formData.category,
          status: formData.status,
          landing_page_content: formData.landing_page_content,
          landing_page_theme: formData.landing_page_theme,
          rules: formData.rules,
          prizes: formData.prizes,
          contact_info: formData.contact_info
        }
        await OrganizerService.updateCompetition(editingCompetition.id, updateData)
      } else {
        // Create new competition
        await OrganizerService.createCompetition(formData)
      }
      
      // Reset form and refresh competitions
      resetForm()
      fetchMyCompetitions()
    } catch (error) {
      console.error('Failed to save competition:', error)
      setError('Failed to save competition. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this competition?')) {
      try {
        await OrganizerService.deleteCompetition(id)
        fetchMyCompetitions()
      } catch (error) {
        console.error('Failed to delete competition:', error)
        alert('Failed to delete competition. Please try again.')
      }
    }
  }

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition)
    setFormData({
      title: competition.title,
      description: competition.description,
      organizer_id: competition.organizer_id,
      start_date: competition.start_date.split('T')[0], // Format for date input
      end_date: competition.end_date.split('T')[0],
      category: competition.category,
      status: competition.status,
      landing_page_content: competition.landing_page_content || '',
      landing_page_theme: competition.landing_page_theme || 'default',
      rules: competition.rules || '',
      prizes: competition.prizes || '',
      contact_info: competition.contact_info || ''
    })
    setShowCreateForm(true)
  }

  const handleBannerUpload = async (competitionId: number, file: File) => {
    try {
      setUploading(competitionId)
      setUploadedBanners(prev => ({ ...prev, [competitionId]: URL.createObjectURL(file) }))
      await OrganizerService.uploadBanner(competitionId, file)
      fetchMyCompetitions() // Refresh to get updated banner URL
      alert('Banner uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload banner:', error)
      alert('Failed to upload banner. Please try again.')
      // Remove Preview on error
      setUploadedBanners(prev => {
        const newState = { ...prev }
        delete newState[competitionId]
        return newState
      })
    } finally {
      setUploading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      organizer_id: user?.id || '',
      start_date: '',
      end_date: '',
      category: '',
      status: 'upcoming',
      landing_page_content: '',
      landing_page_theme: 'default',
      rules: '',
      prizes: '',
      contact_info: ''
    })
    setShowCreateForm(false)
    setEditingCompetition(null)
    setBannerFile(null)
    setShowAdvancedOptions(false)
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

  if (!user || user.profile?.role !== 'organizer') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Create Competition
          </button>
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

        {/* Create/Edit Competition Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingCompetition ? 'Edit Competition' : 'Create Competition'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Competition Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                />
                
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg h-24"
                  required
                />
                
                <input
                  type="date"
                  placeholder="Start Date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                />
                
                <input
                  type="date"
                  placeholder="End Date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                />
                
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Landing Page Customization Toggle */}
                <div className="border-t border-gray-600 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full flex items-center justify-between p-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                  >
                    <span>Landing Page Customization</span>
                    <span className={`transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                </div>

                {/* Advanced Options */}
                {showAdvancedOptions && (
                  <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Landing Page Theme</label>
                      <select
                        value={formData.landing_page_theme}
                        onChange={(e) => setFormData({ ...formData, landing_page_theme: e.target.value as Competition['landing_page_theme'] })}
                        className="w-full p-3 bg-gray-700 rounded-lg"
                      >
                        <option value="default">Default (Blue)</option>
                        <option value="modern">Modern (Purple)</option>
                        <option value="minimal">Minimal (Light)</option>
                        <option value="gaming">Gaming (Green)</option>
                      </select>
                    </div>

                    {/* Landing Page Content */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Custom Landing Page Content</label>
                      <textarea
                        placeholder="Customize your competition's landing page with rich content (HTML supported)..."
                        value={formData.landing_page_content}
                        onChange={(e) => setFormData({ ...formData, landing_page_content: e.target.value })}
                        className="w-full p-3 bg-gray-700 rounded-lg h-32"
                      />
                    </div>

                    {/* Rules */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Rules & Guidelines</label>
                      <textarea
                        placeholder="Competition rules and guidelines (HTML supported)..."
                        value={formData.rules}
                        onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                        className="w-full p-3 bg-gray-700 rounded-lg h-24"
                      />
                    </div>

                    {/* Prizes */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Prizes & Rewards</label>
                      <textarea
                        placeholder="Prize information and rewards (HTML supported)..."
                        value={formData.prizes}
                        onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                        className="w-full p-3 bg-gray-700 rounded-lg h-24"
                      />
                    </div>

                    {/* Contact Info */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Information</label>
                      <textarea
                        placeholder="Contact details for participants (HTML supported)..."
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        className="w-full p-3 bg-gray-700 rounded-lg h-20"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg transition-colors"
                  >
                    {loading ? 'Saving...' : (editingCompetition ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
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

        {/* Competitions List */}
        <div className="grid gap-6">
          {competitions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No competitions yet. Create your first competition!
            </p>
          ) : (
            competitions.map((competition) => (
              <div key={competition.id} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{competition.title}</h3>
                    <p className="text-gray-300 mb-3">{competition.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                      <span>Category: {competition.category}</span>
                      <span>Status: <span className={`font-semibold ${
                        competition.status === 'active' ? 'text-green-500' :
                        competition.status === 'upcoming' ? 'text-blue-500' :
                        competition.status === 'completed' ? 'text-gray-500' :
                        'text-red-500'
                      }`}>{competition.status}</span></span>
                      <span>Start: {new Date(competition.start_date).toLocaleDateString()}</span>
                      <span>End: {new Date(competition.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => router.push(`/competition/${competition.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      View Landing Page
                    </button>
                    <button
                      onClick={() => fetchCompetitionEnrollments(competition)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      View Enrollments
                    </button>
                    <button
                      onClick={() => handleEdit(competition)}
                      className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(competition.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Banner Upload Section */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold mb-2">Competition Banner</h4>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleBannerUpload(competition.id, file)
                        }
                      }}
                      className="text-sm"
                      disabled={uploading === competition.id}
                    />
                    {uploading === competition.id && (
                      <span className="text-sm text-blue-400">Uploading...</span>
                    )}
                  </div>
                  
                  {/* Banner Preview */}
                  <div className="mt-2">
                    <img
                      src={uploadedBanners[competition.id] || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competitions/${competition.id}/banner?t=${new Date(competitions.find(c => c.id === competition.id)?.updated_at || Date.now()).getTime()}`}
                      alt="Competition Banner"
                      className="w-32 h-20 object-cover rounded border border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Enrollment Modal */}
        {showEnrollmentModal && selectedCompetition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Enrollments for "{selectedCompetition.title}"
                </h2>
                <button
                  onClick={() => {
                    setShowEnrollmentModal(false)
                    setSelectedCompetition(null)
                    setCompetitionEnrollments([])
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {competitionEnrollments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg mb-2">No enrollments yet</p>
                  <p className="text-gray-500 text-sm">
                    Teams haven't enrolled in this competition yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    Total Enrollments: {competitionEnrollments.length}
                  </div>
                  
                  {competitionEnrollments.map((enrollment) => (
                    <div key={enrollment.enrollment_id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {enrollment.team_name}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Status: </span>
                              <span className={`font-medium ${
                                enrollment.status === 'enrolled' ? 'text-green-400' :
                                enrollment.status === 'pending' ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Enrolled: </span>
                              <span className="text-gray-300">
                                {enrollment.created_at ? new Date(enrollment.created_at).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {enrollment.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await EnrollmentService.updateEnrollmentStatus(enrollment.enrollment_id, 'enrolled')
                                    // Refresh enrollments
                                    fetchCompetitionEnrollments(selectedCompetition)
                                  } catch (error) {
                                    console.error('Failed to approve enrollment:', error)
                                    setError('Failed to approve enrollment')
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await EnrollmentService.updateEnrollmentStatus(enrollment.enrollment_id, 'rejected')
                                    // Refresh enrollments
                                    fetchCompetitionEnrollments(selectedCompetition)
                                  } catch (error) {
                                    console.error('Failed to reject enrollment:', error)
                                    setError('Failed to reject enrollment')
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to remove this enrollment?')) {
                                try {
                                  await EnrollmentService.deleteEnrollment(enrollment.enrollment_id)
                                  // Refresh enrollments
                                  fetchCompetitionEnrollments(selectedCompetition)
                                } catch (error) {
                                  console.error('Failed to delete enrollment:', error)
                                  setError('Failed to delete enrollment')
                                }
                              }
                            }}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
