import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  count?: number
}

function SkeletonBase({ className, variant = 'text', width, height }: Omit<SkeletonProps, 'count'>) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variant === 'text' && 'rounded h-4',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && '',
        variant === 'rounded' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
    />
  )
}

export default function Skeleton({ count = 1, ...props }: SkeletonProps) {
  if (count === 1) return <SkeletonBase {...props} />
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBase key={i} {...props} />
      ))}
    </div>
  )
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}

export function AthleteCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg mt-1" />
        </div>
      </div>
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
