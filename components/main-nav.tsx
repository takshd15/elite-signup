"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, Target, Users } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Target, label: "Goals", href: "/goals" },
    { icon: Users, label: "Community", href: "/for-you" },
  ]

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-t border-zinc-800"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <nav className="container flex items-center justify-between h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center flex-1 h-full">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-white",
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {active && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                      layoutId="nav-indicator"
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
}

