"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Calendar, Edit3, Save, X, ArrowLeft, Camera, MapPin, Globe, Star, Heart, Award } from "lucide-react"

export default function ProfilePage() {
  const { user, loading, updateUserProfile } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    about: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when user data is available
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        name: user.profile.name || "",
        about: user.profile.about || "",
      })
    }
  }, [user?.profile])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
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
        name: user.profile.name || "",
        about: user.profile.about || "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Only send changed data
      const updatedData: Partial<{ name: string; about: string; location: string; website: string }> = {}

      const trimmedName = formData.name.trim()
      const trimmedAbout = formData.about.trim()

      if (trimmedName !== (user?.profile?.name || "")) {
        updatedData.name = trimmedName
      }

      if (trimmedAbout !== (user?.profile?.about || "")) {
        updatedData.about = trimmedAbout
      }

      // Only update if there are changes
      if (Object.keys(updatedData).length > 0) {
        await updateUserProfile(updatedData)
      }

      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{user.profile?.name || "Welcome"}</h1>
              <p className="text-gray-600 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Member since 2024
                </Badge>
              </div>
            </div>

            {!isEditing && (
              <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-2xl">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
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

        <div className="grid grid-cols-1  gap-8">
          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader className="pb-6">
                <CardTitle className="text-gray-900 flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="about" className="text-gray-700 font-medium">
                        About
                      </Label>
                      <Textarea
                        id="about"
                        name="about"
                        value={formData.about}
                        onChange={handleInputChange}
                        rows={5}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                        placeholder="Tell us about yourself, your interests, achievements, and what makes you unique..."
                      />
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md rounded-2xl"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <Label className="text-gray-500 text-sm font-medium">Email Address</Label>
                        <p className="text-gray-900 text-lg mt-1 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </p>
                      </div>

                      <div>
                        <Label className="text-gray-500 text-sm font-medium">Full Name</Label>
                        <p className="text-gray-900 text-lg mt-1">{user.profile?.name || "Not provided"}</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-200" />

                    <div>
                      <Label className="text-gray-500 text-sm font-medium">About</Label>
                      <div className="mt-3 text-gray-900 leading-relaxed">
                        {user.profile?.about ? (
                          <p className="whitespace-pre-wrap">{user.profile.about}</p>
                        ) : (
                          <p className="text-gray-500 italic">
                            No information provided yet. Click "Edit Profile" to add your bio and let others know more about you.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}