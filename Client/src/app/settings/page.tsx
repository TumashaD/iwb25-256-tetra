"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Calendar, Camera, Edit2 } from "lucide-react"
import { ReadmeEditor } from "@/components/readme-editor"

export default function ProfilePage() {
  const { user, loading, updateUserProfile } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<{
    name: string
    role: 'competitor' | 'organizer' | ''
  }>({
    name: "",
    role: "" as 'competitor' | 'organizer' | ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.profile) {
      setEditedProfile({
        name: user.profile.name || "",
        role: (user.profile.role || "") as 'competitor' | 'organizer' | ''
      })
    }
  }, [user])

  const handleReadmeSave = async (content: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateUserProfile({ readme: content })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update README")
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileSave = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const profileUpdate: any = {
        name: editedProfile.name
      }

      if (editedProfile.role) {
        profileUpdate.role = editedProfile.role
      }

      await updateUserProfile(profileUpdate)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    if (user?.profile) {
      setEditedProfile({
        name: user.profile.name || "",
        role: (user.profile.role || "") as 'competitor' | 'organizer' | ''
      })
    }
    setIsEditing(false)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-700 text-lg">Loading your profile...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen ">
      {/* Header Section */}
      <div className="relative bg-sidebar border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage
                  src={user.avatarUrl || "/placeholder.svg"}
                  alt={user.profile?.name || user.email}
                />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-white text-white text-2xl font-bold">
                  {user.profile?.name ? getUserInitials(user.profile.name) : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button size="sm" variant="secondary" className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-white border-2 border-gray-200 hover:bg-gray-50">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="text-4xl font-bold border-2 border-blue-300 focus:border-blue-500 bg-white/90 p-2 h-auto"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900">{user.profile?.name || "Welcome"}</h1>
                )}
                {!isEditing ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="rounded-full w-8 h-8 p-0 hover:bg-white/80"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="text-xs"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleProfileSave}
                      className="text-xs"
                      disabled={isSubmitting}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Member since 2024
                </Badge>
                {isEditing ? (
                  <Select
                    value={editedProfile.role}
                    onValueChange={(value) => setEditedProfile(prev => ({ ...prev, role: value as 'competitor' | 'organizer' | '' }))}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competitor">Competitor</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 capitalize">
                    {user.profile?.role || 'Member'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* README Editor */}
          <ReadmeEditor
            initialContent={user.profile?.readme || ""}
            onSave={handleReadmeSave}
            isSubmitting={isSubmitting}
            profile={{
              name: user.profile?.name,
              email: user.email,
              role: user.profile?.role,
              about: user.profile?.about
            }}
          />
        </div>
      </div>
    </div>
  )
}