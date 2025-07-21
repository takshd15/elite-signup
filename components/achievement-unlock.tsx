"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AchievementUnlockProps {
  title: string
  description: string
  xp: number
  icon?: React.ReactNode
  duration?: number
  onClose?: () => void
}

export function AchievementUnlock({
  title,
  description,
  xp,
  icon = <Award className="h-5 w-5 text-yellow-500" />,
  duration = 5000,
  onClose,
}: AchievementUnlockProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs"
        >
          <div className="bg-zinc-900/90 backdrop-blur-lg border border-yellow-500/30 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-grotesk font-bold text-yellow-500">Achievement Unlocked!</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-zinc-800/50"
                onClick={handleClose}
              >
                <X className="h-3 w-3 text-zinc-400" />
              </Button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-full">{icon}</div>
                <div>
                  <h4 className="font-medium">{title}</h4>
                  <p className="text-sm text-zinc-400 mt-1">{description}</p>
                  <div className="mt-2 text-xs text-yellow-500 font-medium">+{xp} XP</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

