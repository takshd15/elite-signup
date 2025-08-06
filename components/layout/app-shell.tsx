import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { MainNav } from "@/components/main-nav"

interface AppShellProps {
  children: React.ReactNode
  title?: string
  showBackButton?: boolean
  backUrl?: string
  rightElement?: React.ReactNode
  showNav?: boolean
  className?: string
}

export function AppShell({
  children,
  title,
  showBackButton = false,
  backUrl,
  rightElement,
  showNav = true,
  className,
}: AppShellProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <SiteHeader title={title} showBackButton={showBackButton} backUrl={backUrl} rightElement={rightElement} />

      {/* Main Content */}
      <main className={`flex-1 overflow-auto pb-20 ${className}`}>{children}</main>

      {/* Bottom Navigation */}
      {showNav && <MainNav />}
    </div>
  )
}

