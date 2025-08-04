'use client'

import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useState } from 'react'
import APITester from '@/components/APITester'
import { Avatar,AvatarImage,AvatarFallback } from '@/components/ui/avatar'
import { SignInPage } from '@/components/SignIn'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const [imageError, setImageError] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen justify-center items-center">
      <SignInPage />
    </div>
    // <div className="min-h-screen bg-gray-50">
    //   {/* Header */}
    //   <header className="bg-white shadow-sm">
    //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    //       <div className="flex justify-between items-center py-6">
    //         <h1 className="text-2xl font-bold text-gray-900">
    //           Competition Platform
    //         </h1>
    //         {user && (
    //           <div className="flex items-center space-x-4">
    //             <div className="flex items-center space-x-2">
    //               <Avatar>
    //                 <AvatarImage
    //                   src={user.user_metadata?.avatar_url || ''}
    //                   alt="User Avatar"
    //                   onError={() => setImageError(true)}
    //                   className={imageError ? 'hidden' : ''}
    //                 />
    //                 <AvatarFallback className="bg-gray-200 text-gray-600">
    //                   {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
    //                 </AvatarFallback>
    //               </Avatar>
    //               <span className="text-sm text-gray-700">
    //                 {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
    //               </span>
    //             </div>
    //             <button
    //               onClick={signOut}
    //               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    //             >
    //               Sign Out
    //             </button>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   </header>

    //   {/* Main Content */}
    //   <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    //     <div className="px-4 py-6 sm:px-0">
    //       <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
    //         <div className="text-center">
    //           <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
    //             Welcome to Competition Platform
    //           </h2>
    //           {user ? (
    //             <div className="space-y-4">
    //               <p className="text-lg text-gray-600">
    //                 Hello, {user.user_metadata?.full_name || user.email}!
    //               </p>
    //               <p className="text-gray-500">
    //                 You are successfully signed in with Google.
    //               </p>
    //               <div className="bg-gray-100 rounded-lg p-4 mt-6">
    //                 <h3 className="text-lg font-medium text-gray-900 mb-2">
    //                   User Information:
    //                 </h3>
    //                 <div className="text-left space-y-2">
    //                   <p><strong>Email:</strong> {user.email}</p>
    //                   <p><strong>ID:</strong> {user.id}</p>
    //                   <p><strong>Provider:</strong> {user.app_metadata?.provider}</p>
    //                   <p><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at || '').toLocaleString()}</p>
    //                   <p><strong>Avatar URL:</strong> {user.user_metadata?.avatar_url || 'Not available'}</p>
    //                 </div>
    //               </div>

    //               {/* API Testing Component */}
    //               <div className="mt-8">
    //                 <APITester />
    //               </div>
    //             </div>
    //           ) : (
    //             <p className="text-lg text-gray-600">
    //               Please <a href="/login" className="text-blue-600 hover:underline">Login</a> to continue.
                  
    //             </p>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //   </main>
    // </div>
  )
}
