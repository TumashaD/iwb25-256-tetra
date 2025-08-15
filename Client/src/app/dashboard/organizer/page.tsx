'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CompetitionsService, Competition } from '@/services/competitionService'
import { Navbar } from '@/components/ui/navbar'
import { OrganizerService } from '@/services/organizerService'

export default function OrganizerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: '',
    description: '',
    organizer_id: '',
    start_date: '',
    end_date: '',
    category: '',
    status: 'upcoming'
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedBanners, setUploadedBanners] = useState<Record<number, string>>({})

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
          status: formData.status
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
      status: competition.status
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
      status: 'upcoming'
    })
    setShowCreateForm(false)
    setEditingCompetition(null)
    setBannerFile(null)
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
      </div>
    </div>
  )
}
