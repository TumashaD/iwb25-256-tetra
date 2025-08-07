import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassButton } from '@/components/ui/glass'
import { User } from '@/types/user'

interface DetailsStepProps {
  user: User
  role: string
  onSubmit: (userData: { name: string; email: string; role: string; about?: string }) => Promise<void>
  onBack: () => void
  isSubmitting: boolean
}

export function DetailsStep({ user, role, onSubmit, onBack, isSubmitting }: DetailsStepProps) {
  const [fullName, setFullName] = useState('')
  const [about, setAbout] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name: fullName,
      email: user.email || '',
      role: role,
      about: about
    })
  }

  return (
    <motion.div
      key="details-step"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[#edfefd]">
        Complete Your Profile
      </h1>
      <p className="text-[1.25rem] text-[#edfefd] font-light">
        Please provide your details to join Vinnova
      </p>
      
      {/* User Details Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
        
        <input 
          type="email" 
          placeholder={user.email || "Email"}
          value={user.email || ''}
          disabled
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-600"
        />
        
        <select 
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={role} 
          disabled={isSubmitting}
          onChange={() => {}} // Read-only for now, can be enhanced later
        >
          <option value="competitor">Competitor</option>
          <option value="organizer">Organizer</option>
        </select>
        
        <textarea
          placeholder="Tell us about yourself (optional)"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        
        <GlassButton 
          className="w-full mt-6"
          disabled={isSubmitting || !fullName.trim()}
          type="submit"
        >
          {isSubmitting ? "Creating Profile..." : "Submit Details"}
        </GlassButton>
      </form>

      {/* Back Button */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0 }}
        className="flex justify-center pt-4"
      >
        <GlassButton 
          onClick={onBack}
          className="px-6 py-2 text-sm"
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-gray-700">Back to Role Selection</span>
          </div>
        </GlassButton>
      </motion.div>
    </motion.div>
  )
}
