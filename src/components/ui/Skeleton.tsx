/**
 * Skeleton loading placeholder component.
 * Use while async content is loading to prevent layout shift.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a full card (e.g., review card, product card) */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-3 p-4 border rounded-lg ${className}`} aria-hidden="true">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** Skeleton for a price line */
export function SkeletonPrice({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex justify-between mt-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
