interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <Skeleton className="h-5 w-20 mb-2" />
      <Skeleton className="h-6 w-full mb-3" />
      <div className="space-y-2 mb-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-3" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
