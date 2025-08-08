"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GlassButton, GlassFilter } from "./ui/glass";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { UserService } from "@/services/userService";

interface SignInPageProps {
  className?: string;
}

export const SignInPage = ({ className }: SignInPageProps) => {
  const {signInWithGoogle,user,loading} = useAuth();
  const [role,setRole] = useState<"competitor" | "organizer">("competitor");
  const [step, setStep] = useState<"role" | "login" | "details" | "success">("role");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "competitor" as "competitor" | "organizer",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Persist role selection in localStorage to survive OAuth redirect
  useEffect(() => {
    const savedRole = localStorage.getItem('selectedRole') as "competitor" | "organizer" | null;
    if (savedRole) {
      setRole(savedRole);
    }
  }, []);

  // Handle user authentication state changes
  useEffect(() => {
    if (user && !loading) {
      // If user is authenticated, go directly to details step
      setStep("details");
      // Pre-populate form data with user information
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
        role: (localStorage.getItem('selectedRole') as "competitor" | "organizer") || role
      }));
      // Clear the saved role since we no longer need it
      localStorage.removeItem('selectedRole');
    }
  }, [user, loading, role]);

  const handleRoleClick = (selectedRole: "competitor" | "organizer") => {
    setRole(selectedRole);
    // Save role to localStorage before OAuth redirect
    localStorage.setItem('selectedRole', selectedRole);
    setStep("login");
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // Handle error (e.g., show a notification)
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission started");
    console.log("User:", user);
    console.log("Form data:", formData);
    
    if (!user) {
      console.error("No user found");
      alert("No user found. Please try logging in again.");
      return;
    }
    
    if (!formData.fullName.trim()) {
      console.error("Full name is required");
      alert("Please enter your full name");
      return;
    }
    
    if (!formData.email.trim()) {
      console.error("Email is required");
      alert("Email is required");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData = {
        id: user.id,
        email: user.email,
        name: formData.fullName,
        role: formData.role,
      };
      const result = await UserService.createUserProfile(userData);
      console.log("User profile created successfully:", result);
      setStep("success");
    } catch (error) {
      console.error("Error creating user profile:", error);
      alert("Error creating user profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-white relative", className)}>
        {/* Video Background */}
        <div className="absolute inset-0 z-0 opacity-80">
        <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
        >
            <source src="/background.mp4" type="video/mp4" />
            <source src="/background.webm" type="video/webm" />
            Your browser does not support the video tag.
        </video>
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
        </div>
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Main content container */}
        <div className="flex flex-1 flex-col lg:flex-row ">
          {/* Left side (form) */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-fit mt-20">
              <AnimatePresence mode="wait">
                {step === "role" ? (
                    <motion.div 
                    key="role-step"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                    >
                    <h1 className="text-[5rem] font-bold tracking-tight text-[#edfefd]">Welcome to Vinnova</h1>
                    <p className="text-[1.8rem] text-[#edfefd] font-light">Find or Organize your competitions</p>
                    
                    <div className="space-y-4 max-w-sm mx-auto ">
                      <div className="flex justify-center ">
                      <GlassFilter />
                        <GlassButton className="w-2/3" onClick={() => handleRoleClick("competitor")}>
                          <p className=" text-cyan-700 ">Competitor</p>
                        </GlassButton>
                      </div>
                      <div className="flex items-center gap-4 w-2/3 mx-auto">
                        <div className="h-px bg-gray-300 flex-1" />
                        <span className="text-gray-500 font-semibold text-sm">or</span>
                        <div className="h-px bg-gray-300 flex-1" />
                      </div>
                      
                      <div className="flex justify-center ">
                        <GlassButton className="w-2/3" onClick={() => handleRoleClick("organizer")}>
                          <p className=" text-fuchsia-900 ">Organizer</p>
                        </GlassButton>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 pt-10 mb-0">
                      By signing up, you agree to the <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">MSA</Link>, <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Product Terms</Link>, <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Policies</Link>, 
                    </p>
                    <p className="text-xs text-gray-500">
                        <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Privacy Notice</Link>, and <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Cookie Notice</Link>.
                    </p>
                  </motion.div>
                ) : step === "login" ? (
                  <motion.div 
                    key="code-step"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[#edfefd]">
                      {role === "competitor" ? "Join as Competitor" : "Join as Organizer"}
                    </h1>
                    <p className="text-[1.25rem] text-[#edfefd] font-light">
                      {role === "competitor" ? "Enter your email to join the competition" : "Enter your email to create an event"}
                    </p>
                    {/* Google Login Button */}
                    <div className="flex justify-center">
                      <GlassButton className="w-2/3" onClick={handleGoogleSignIn}>
                        {/* Google Logo Button */}
                        <div className="flex items-center justify-center">
                          <img src="/google.svg" alt="Google Logo" className="h-4 mr-2" />
                          <p className="text-gray-800">Continue with Google</p>
                        </div>
                      </GlassButton>
                    </div>
                    {/* Back Button */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0 }}
                      className="flex justify-center pt-4"
                    >
                      <GlassButton 
                        onClick={() => setStep("role")}
                        className="px-6 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span className="text-gray-700">Back to Role Selection</span>
                        </div>
                      </GlassButton>
                    </motion.div>
                    
                    <div className="pt-16">
                      <p className="text-xs text-gray-500">
                        By signing up, you agree to the <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">MSA</Link>, <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Product Terms</Link>, <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Policies</Link>, <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Privacy Notice</Link>, and <Link href="#" className="underline text-gray-500 hover:text-gray-700 transition-colors">Cookie Notice</Link>.
                      </p>
                    </div>
                  </motion.div>
                ) : step === "details" && user ? (
                  // Get User Details Step
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
                    <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input 
                        type="email" 
                        placeholder={user.email || "Email"}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black"
                      />
                      {/* Give the option to change the role */}
                      <select 
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={formData.role} 
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "competitor" | "organizer" })}>
                        <option value="competitor">Competitor</option>
                        <option value="organizer">Organizer</option>
                      </select>
                      <GlassButton 
                        className="w-full mt-6"
                        disabled={isSubmitting || !formData.fullName.trim()}
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
                        onClick={() => setStep("login")}
                        className="px-6 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span className="text-gray-700">Back to Login</span>
                        </div>
                      </GlassButton>
                    </motion.div>
                  </motion.div>
                ) : step === "success" ? (
                  // Success Step
                  <motion.div 
                    key="success-step"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-[#edfefd]">You're in!</h1>
                      <p className="text-[1.25rem] text-[#edfefd] font-light">Welcome</p>
                    </div>
                    
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="py-10"
                    >
                      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>
                    
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="w-full rounded-full bg-black text-white font-medium py-3 hover:bg-gray-800 transition-colors"
                    >
                      Continue to Dashboard
                    </motion.button>
                  </motion.div>
                ): (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                  </div>
                )}
              </AnimatePresence>
          </div>
          
        </div>
      </div>
    </div>
    </div>
  );
}
