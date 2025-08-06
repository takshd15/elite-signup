import { Skeleton } from "@/components/ui/skeleton"

export default function MentorshipLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/90 backdrop-blur-lg">
        <div className="container h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 overflow-auto pb-20 p-4">
        {/* Search Bar Skeleton */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 px-4 py-3">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>

        {/* Tabs Skeleton */}
        <div className="sticky z-10 bg-black/95 backdrop-blur-lg border-b border-zinc-800 top-[69px]">
          <div className="flex w-full justify-between h-12">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1 mx-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>

        {/* Content Skeletons */}
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          {/* Featured Mentors Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 mb-3" />
            {[1, 2].map((i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Skeleton className="h-16 w-16 rounded-full mr-4" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-48 mt-2" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-5 w-20 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* All Mentors Skeleton */}
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Skeleton className="h-16 w-16 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-5 w-20 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

