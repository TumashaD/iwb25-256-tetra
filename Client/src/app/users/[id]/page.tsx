"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserService, type Profile } from "@/services/userService"
import { ProfileView } from "@/components/profile-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertCircle, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function UserProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const userId = params.id as string

    const [user, setUser] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) {
                setError("User ID is required")
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                const userData = await UserService.getUser(userId)

                if (!userData) {
                    setError("User not found")
                } else {
                    setUser(userData)
                }
            } catch (error) {
                console.error("Failed to fetch user:", error)
                setError(error instanceof Error ? error.message : "Failed to load user profile")
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [userId])

    const handleGoBack = () => {
        // Go back to previous page or home if no history
        if (window.history.length > 1) {
            router.back()
        } else {
            router.push("/")
        }
    }

    const isOwnProfile = currentUser?.id === userId

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Loading Profile</h3>
                        <p className="text-sm text-gray-600 text-center">
                            Please wait while we fetch the user profile...
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            {error || "The user profile you're looking for doesn't exist or has been removed."}
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleGoBack} variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Go Back
                            </Button>
                            <Button onClick={() => router.push("/")} variant="default">
                                Go Home
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Transform Profile to the format expected by ProfileView
    const profileViewUser = {
        id: user.id,
        email: user.email,
        avatarUrl: undefined, // We can add avatar support later
        profile: {
            name: user.name,
            role: user.role,
            about: user.about,
            readme: user.readme,
            createdAt: user.createdAt
        }
    }

    return (
        <div className="min-h-screen">
            {/* Add top padding to account for fixed header */}
            <div >
                {isOwnProfile && (
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                This is your profile. You can edit it in
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-blue-600 underline"
                                    onClick={() => router.push("/settings")}
                                >
                                    Settings
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <ProfileView
                    user={profileViewUser}
                    showContact={!isOwnProfile} // Hide contact info on own profile
                />
            </div>
        </div>
    )
}