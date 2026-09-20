export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200/80 ${className}`} aria-hidden="true" />
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export function ReviewsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading reviews">
      {Array.from({ length: count }, (_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <Skeleton className="h-52 w-full rounded-none sm:h-72" />
      <div className="space-y-3 px-5 pb-6 pt-5 sm:px-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
    </div>
  )
}

export function SummarySkeleton() {
  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <Skeleton className="h-12 w-20" />
      <Skeleton className="mt-4 h-4 w-24" />
      <div className="my-5 h-px bg-line" />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-2 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}