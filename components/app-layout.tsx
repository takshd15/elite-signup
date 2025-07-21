import type React from "react"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Remove EnhancedNav from here to avoid duplication */}
      <main className="flex-1">{children}</main>
    </div>
  )
}

