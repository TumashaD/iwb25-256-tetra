'use client'

import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/navbar'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useUser } from '@/contexts/UserContext'

export default function Home() {

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-4xl font-bold">Welcome to the Home Page</h1>
        <p className="mt-4 text-lg">This is the main content area.</p>
      </main>
    </>
  )
}