"use client"

import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakIndicatorProps {
  streak: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StreakIndicator({ streak, size = "md", className }: StreakIndicatorProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const iconSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const getStreakColor = () => {
    if (streak >= 30) return "text-red-500"
    if (streak >= 14) return "text-orange-500"
    return "text-yellow-500"
  }

  return (
    <div className={cn("flex items-center gap-1.5", sizeClasses[size], className)}>
      <div className="relative">
        <Flame className={cn(iconSize[size], getStreakColor())} />
      </div>
      <div className="font-bold">{streak}</div>
      <div className="text-zinc-400 text-xs">days</div>
    </div>
  )
}

