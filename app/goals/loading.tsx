import { Skeleton } from "@/components/ui/skeleton"
import { AppShell } from "@/components/layout/app-shell"

export default function GoalsLoading() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section Skeleton */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <Skeleton className="h-10 w-3/4 mx-auto mb-3" />
          <Skeleton className="h-5 w-full mx-auto mb-6" />

          {/* Key Benefits Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800"
              >
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Create Goal CTA Skeleton */}
        <div className="mb-10 flex justify-center">
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goals Section Skeleton */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-48" />
              </div>
            </div>

            {/* Category Filter Skeleton */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-24" />
              ))}
            </div>

            {/* Goals List Skeleton */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>

                  <Skeleton className="h-2 w-full mb-4" />

                  <div className="space-y-2 mt-4">
                    <Skeleton className="h-5 w-36 mb-2" />
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-9 w-32" />
                      <Skeleton className="h-9 w-32" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            {/* Progress Summary Skeleton */}
            <div className="rounded-lg border border-primary-500/30 bg-gradient-to-br from-primary-900/20 to-secondary-900/20 p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <Skeleton className="h-8 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <Skeleton className="h-8 w-8 mx-auto mb-1" />
                    <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Skeleton */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>

              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-7 h-7 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 border border-dashed border-zinc-700 rounded-lg">
                <Skeleton className="h-4 w-48 mx-auto mb-2" />
                <Skeleton className="h-3 w-40 mx-auto" />
              </div>
            </div>

            {/* Upcoming Challenges Skeleton */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="w-full h-10 mt-4" />
            </div>
          </div>
        </div>

        {/* Success Stories Skeleton */}
        <div className="mt-12">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                <Skeleton className="h-16 w-full mb-4" />

                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ethical Messaging Skeleton */}
        <div className="mt-12 mb-6">
          <div className="bg-white/10 backdrop-blur-lg border-white/20 border rounded-lg p-6">
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-4 w-full mb-4" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-zinc-800/30 p-4 rounded-lg">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              ))}
            </div>

            <Skeleton className="h-4 w-3/4 mx-auto mt-4" />
          </div>
        </div>

        {/* Call to Action Skeleton */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-full mx-auto mb-2" />
          <Skeleton className="h-4 w-3/4 mx-auto mb-6" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-10 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-10 w-48 mx-auto sm:mx-0" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

