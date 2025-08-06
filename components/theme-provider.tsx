"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: string
}

const initialState: {
  theme: Theme
  setTheme: (theme: Theme) => void
} = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  attribute = "class",
  enableSystem = true,
  ...props
}: ThemeProviderProps & { enableSystem?: boolean }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage on initial load
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme
      return stored || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => {
        root.classList.remove("light", "dark")
        const newTheme = mediaQuery.matches ? "dark" : "light"
        root.classList.add(newTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    root.classList.add(theme)
  }, [theme, enableSystem])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme)
      }
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

