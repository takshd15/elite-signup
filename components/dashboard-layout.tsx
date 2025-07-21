"use client"

import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { EnhancedNav } from "@/components/enhanced-nav"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/footer"

interface DashboardLayoutProps {
  children: ReactNode
  showBottomNav?: boolean
  showFooter?: boolean
}

export function DashboardLayout({ children, showBottomNav = true, showFooter = true }: DashboardLayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
    // In a real app, you would also update the document class and store the preference
    if (theme === "dark") {
      document.documentElement.classList.remove("dark")
    } else {
      document.documentElement.classList.add("dark")
    }
  }

  return (
    <div className={`min-h-screen flex flex-col bg-black text-white ${theme}`}>
      <EnhancedNav theme={theme} onThemeToggle={toggleTheme} />

      <motion.main
        className="flex-1 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      {showBottomNav && <MainNav />}
      {showFooter && <Footer />}
    </div>
  )
}

