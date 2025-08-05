import React from 'react'
import { motion } from 'framer-motion'
import { GlassButton, GlassFilter } from '@/components/ui/glass'

interface RoleStepProps {
  onRoleSelect: (role: string) => void
  isSubmitting?: boolean
}

export function RoleStep({ onRoleSelect, isSubmitting = false }: RoleStepProps) {
  return (
    <motion.div 
      key="role-step"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 text-center"
    >
      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[#edfefd]">
        Choose Your Role
      </h1>
      <p className="text-[1.25rem] text-[#edfefd] font-light">
        How would you like to use Vinnova?
      </p>
      
      <div className="space-y-4 max-w-sm mx-auto">
        <div className="flex justify-center">
          <GlassFilter />
          <GlassButton 
            className="w-2/3" 
            onClick={() => onRoleSelect("competitor")}
            disabled={isSubmitting}
          >
            <p className="text-cyan-700">Competitor</p>
          </GlassButton>
        </div>
        
        <div className="flex items-center gap-4 w-2/3 mx-auto">
          <div className="h-px bg-gray-300 flex-1" />
          <span className="text-gray-500 font-semibold text-sm">or</span>
          <div className="h-px bg-gray-300 flex-1" />
        </div>
        
        <div className="flex justify-center">
          <GlassButton 
            className="w-2/3" 
            onClick={() => onRoleSelect("organizer")}
            disabled={isSubmitting}
          >
            <p className="text-fuchsia-900">Organizer</p>
          </GlassButton>
        </div>
      </div>
    </motion.div>
  )
}
