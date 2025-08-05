import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassButton, GlassFilter } from '@/components/ui/glass'

interface LoginStepProps {
  onGoogleSignUp: () => void
  isSubmitting?: boolean
}

export function LoginStep({ onGoogleSignUp, isSubmitting = false }: LoginStepProps) {
  return (
    <motion.div 
      key="login-step"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <h1 className="text-[5rem] font-bold tracking-tight text-[#edfefd]">
        Welcome to Vinnova
      </h1>
      <p className="text-[1.8rem] text-[#edfefd] font-light">
        Sign in to continue
      </p>
      
      {/* Google Login Button */}
      <div className="flex justify-center">
        <GlassFilter />
        <GlassButton 
          className="w-2/3" 
          onClick={onGoogleSignUp}
          disabled={isSubmitting}
        >
          <div className="flex items-center justify-center">
            <img src="/google.svg" alt="Google Logo" className="h-4 mr-2" />
            <p className="text-gray-800">
              {isSubmitting ? 'Signing up...' : 'Continue with Google'}
            </p>
          </div>
        </GlassButton>
      </div>
      
      <p className="text-xs text-gray-500 pt-10 mb-0">
        By signing up, you agree to the{' '}
        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">
          MSA
        </Link>
        ,{' '}
        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">
          Product Terms
        </Link>
        ,{' '}
        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">
          Policies
        </Link>
        ,
      </p>
      <p className="text-xs text-gray-500">
        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">
          Privacy Notice
        </Link>
        , and{' '}
        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">
          Cookie Notice
        </Link>
        .
      </p>
    </motion.div>
  )
}
