"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import the search page component with no SSR
const SearchPageClient = dynamic(() => import("./search-implementation"), {
  ssr: false,
  loading: () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-8 w-24 bg-zinc-800" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full bg-zinc-800 rounded-xl" />
      ))}
    </div>
  ),
})

export default function SearchClientWrapper() {
  return <SearchPageClient />
}

