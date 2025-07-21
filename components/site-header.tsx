"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  title?: string
  showBackButton?: boolean
  backUrl?: string
  rightElement?: React.ReactNode
  className?: string
}

export function SiteHeader({
  title,
  showBackButton = false,
  backUrl = "/home",
  rightElement,
  className,
}: SiteHeaderProps) {
  const router = useRouter()

  return (
    <motion.header
      className={cn("sticky top-0 z-50 border-b border-zinc-800 bg-black/90 backdrop-blur-lg", className)}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <EnhancedButton
                variant="ghost"
                size="icon"
                rounded="full"
                className="text-white -ml-2 hover:bg-zinc-800"
                onClick={() => router.push(backUrl)}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </EnhancedButton>
            </motion.div>
          )}

          {title ? (
            <motion.h1
              className="text-lg font-semibold truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h1>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/home" className="text-xl font-bold gradient-text">
                ELITESCORE
              </Link>
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {rightElement}
        </motion.div>
      </div>
    </motion.header>
  )
}

