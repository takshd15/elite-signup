"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Search, Target, Users, Zap, Bell } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    {
      name: "Home",
      href: "/home",
      icon: Home,
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
    },
    {
      name: "Goals",
      href: "/goals",
      icon: Target,
    },
    {
      name: "Community",
      href: "/community",
      icon: Users,
    },
    {
      name: "Improve",
      href: "/improve",
      icon: Zap,
    },
    {
      name: "Alerts",
      href: "/notifications",
      icon: Bell,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div
                  className={`flex flex-col items-center justify-center transition-colors ${isActive ? "text-primary-500" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] mt-1">{item.name}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

