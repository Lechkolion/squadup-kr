import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: boolean;
}

export function Skeleton({ className, height, width, rounded }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', rounded && 'rounded-full', className)}
      style={{ height, width }}
    />
  );
}

export function GamerCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12" rounded />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-28 rounded" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded" />
        <Skeleton className="h-8 flex-1 rounded" />
      </div>
    </div>
  );
}
