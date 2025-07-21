"use client"

import { Star, Trophy, Award } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface LevelIndicatorProps {
  level: number
  currentXP: number
  nextLevelXP: number
  size?: "sm" | "md" | "lg"
  showProgress?: boolean
  className?: string
}

export function LevelIndicator({
  level,
  currentXP,
  nextLevelXP,
  size = "md",
  showProgress = true,
  className,
}: LevelIndicatorProps) {
  const progress = (currentXP / nextLevelXP) * 100

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  }

  const getLevelIcon = () => {
    if (level >= 20) return <Trophy className="h-4 w-4" />
    if (level >= 10) return <Award className="h-4 w-4" />
    return <Star className="h-4 w-4" />
  }

  const getBorderColor = () => {
    if (level >= 20) return "border-yellow-500"
    if (level >= 10) return "border-indigo-500"
    return "border-purple-500"
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center font-bold",
          sizeClasses[size],
          getBorderColor(),
          "border-2 bg-zinc-900",
        )}
      >
        <span>{level}</span>

        <div className="absolute -top-1 -right-1 bg-zinc-900 rounded-full p-0.5 border border-zinc-700">
          {getLevelIcon()}
        </div>
      </div>

      {showProgress && (
        <div className="mt-1 w-full max-w-[100px]">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
            <span>{currentXP}</span>
            <span>{nextLevelXP}</span>
          </div>
          <Progress
            value={progress}
            className="h-1 bg-zinc-800 overflow-hidden relative progress-animate"
            indicatorClassName="bg-gradient-to-r from-purple-600 to-indigo-600"
          />
        </div>
      )}
    </div>
  )
}

