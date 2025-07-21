import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-12 w-full bg-zinc-800 rounded-xl mb-6" />

      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="h-8 w-24 bg-zinc-800" />
      </div>

      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-24 w-full bg-zinc-800 rounded-xl" />
      ))}
    </div>
  )
}

