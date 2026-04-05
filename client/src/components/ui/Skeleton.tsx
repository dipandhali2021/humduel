interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

/** Animated placeholder block to reserve layout space and prevent CLS. */
const Skeleton = ({ className = '', width, height }: SkeletonProps) => (
  <div
    className={`animate-pulse rounded-xl bg-surface-elevated ${className}`}
    style={{ width, height }}
    role="status"
    aria-label="Loading"
  />
);

/** Full-page skeleton matching PageContainer layout for route-level Suspense. */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-surface px-4 pt-16 pb-24 mx-auto max-w-[480px]">
    {/* Header area */}
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    {/* Content blocks */}
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);

export default Skeleton;
