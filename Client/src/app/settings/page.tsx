"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const { user, loading, updateUserProfile } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    role: 'competitor' as 'competitor' | 'organizer'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when user data is available
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.name || '',
        about: user.profile.about || '',
        role: user.profile.role || 'competitor'
      })
    }
  }, [user?.profile])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    // Reset form data to original values
    if (user?.profile) {
      setFormData({
        name: user.profile.name || '',
        about: user.profile.about || '',
        role: user.profile.role || 'competitor'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Only send changed data
      const updatedData: Partial<{name: string, about: string, role: 'competitor' | 'organizer'}> = {}
      
      const trimmedName = formData.name.trim()
      const trimmedAbout = formData.about.trim()
      
      if (trimmedName !== (user?.profile?.name || '')) {
        updatedData.name = trimmedName
      }
      
      if (trimmedAbout !== (user?.profile?.about || '')) {
        updatedData.about = trimmedAbout
      }
      
      if (formData.role !== (user?.profile?.role || 'competitor')) {
        updatedData.role = formData.role
      }
      
      // Only update if there are changes
      if (Object.keys(updatedData).length > 0) {
        await updateUserProfile(updatedData)
      }
      
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Information</h2>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Email:</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Full Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Role:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="competitor">Competitor</option>
                  <option value="organizer">Organizer</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">About:</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-gray-400">Email:</label>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <label className="text-gray-400">Full Name:</label>
                <p className="text-white">{user.profile?.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-gray-400">Role:</label>
                <p className="text-white capitalize">{user.profile?.role || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-gray-400">About:</label>
                <p className="text-white">{user.profile?.about || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  )
}
