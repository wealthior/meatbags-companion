"use client";

import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-bg-elevated",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-4 space-y-3">
      <Skeleton className="h-48 w-full rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-lg p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-neon-green rad-pulse" />
        <span className="text-xs text-text-muted uppercase tracking-wider typewriter">
          Scanning wasteland...
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
