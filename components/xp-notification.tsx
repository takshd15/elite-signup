"use client"

import { useState, useEffect } from "react"
import { Plus, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface XPNotificationProps {
  xp: number
  message?: string
  duration?: number
  onComplete?: () => void
}

export function XPNotification({ xp, message = "XP Earned!", duration = 3000, onComplete }: XPNotificationProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onComplete) onComplete()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <motion.div
            className="bg-zinc-900/90 backdrop-blur-lg border border-primary-500/30 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="bg-primary-500/20 p-1 rounded-full"
              initial={{ rotate: -30 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 10 }}
            >
              <Star className="h-4 w-4 text-primary-500" />
            </motion.div>
            <div>
              <motion.div
                className="flex items-center"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Plus className="h-3 w-3 text-primary-500 mr-0.5" />
                <motion.span
                  className="font-bold text-primary-500"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {xp} XP
                </motion.span>
              </motion.div>
              <motion.div
                className="text-xs text-zinc-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

