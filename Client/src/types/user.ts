import type { Profile } from "@/services/userService"

export type User = {
  id: string
  email: string
  isAuthenticated: boolean
  profile: Profile | null
  avatarUrl?: string
} 