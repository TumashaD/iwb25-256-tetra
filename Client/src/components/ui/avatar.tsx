"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        "backdrop-blur-md  border border-white/30",
        "shadow-lg shadow-black/10",
        "transition-all duration-300 hover:bg-white/10 hover:shadow-xl hover:shadow-black/20",
        "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full relative z-10",
        "rounded-full object-cover",
        "mix-blend-overlay opacity-90",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full relative z-10",
        "bg-gradient-to-br from-white/40 to-white/20",
        "text-white/90 font-medium text-sm",
        "backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
