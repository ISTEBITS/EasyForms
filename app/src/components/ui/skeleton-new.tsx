import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-4">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xs border border-border/60 bg-zinc-950/40 p-5 backdrop-blur-sm">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-zinc-800/80" />
          <Skeleton className="h-4 w-72 bg-zinc-800/50" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xs bg-zinc-800/60" />
          <Skeleton className="h-9 w-32 rounded-xs bg-zinc-800/80" />
        </div>
      </div>

      {/* Overview Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xs border border-border/50 bg-zinc-950/40 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-zinc-800/50" />
              <Skeleton className="h-4 w-4 rounded-full bg-zinc-800/60" />
            </div>
            <Skeleton className="h-8 w-20 bg-zinc-800/90" />
            <Skeleton className="h-3 w-32 bg-zinc-800/40" />
          </div>
        ))}
      </div>

      {/* Toolbar / Search Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
        <Skeleton className="h-9 w-full sm:w-72 rounded-xs bg-zinc-800/60" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xs bg-zinc-800/50" />
          <Skeleton className="h-9 w-9 rounded-xs bg-zinc-800/50" />
        </div>
      </div>

      {/* Form Grid Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xs border border-border/60 bg-zinc-950/40 p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 pr-4">
                <Skeleton className="h-5 w-3/4 bg-zinc-800/80" />
                <Skeleton className="h-3 w-full bg-zinc-800/40" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full bg-zinc-800/60" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <Skeleton className="h-4 w-20 bg-zinc-800/50" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xs bg-zinc-800/60" />
                <Skeleton className="h-8 w-8 rounded-xs bg-zinc-800/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-4">
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 p-5 space-y-2">
        <Skeleton className="h-6 w-40 bg-zinc-800/80" />
        <Skeleton className="h-4 w-64 bg-zinc-800/50" />
      </div>
      <Skeleton className="h-9 w-full sm:w-80 rounded-xs bg-zinc-800/60" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xs border border-border/60 bg-zinc-950/40 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/2 bg-zinc-800/80" />
              <Skeleton className="h-4 w-8 rounded bg-zinc-800/50" />
            </div>
            <Skeleton className="h-3 w-full bg-zinc-800/40" />
            <Skeleton className="h-3 w-4/5 bg-zinc-800/40" />
            <div className="pt-3 border-t border-border/40 flex justify-end">
              <Skeleton className="h-8 w-24 rounded-xs bg-zinc-800/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponsesSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-4">
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 p-5 space-y-2">
        <Skeleton className="h-6 w-48 bg-zinc-800/80" />
        <Skeleton className="h-4 w-80 bg-zinc-800/50" />
      </div>
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <Skeleton className="h-5 w-36 bg-zinc-800/70" />
          <Skeleton className="h-8 w-28 rounded-xs bg-zinc-800/60" />
        </div>
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48 bg-zinc-800/80" />
                <Skeleton className="h-3 w-32 bg-zinc-800/40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-zinc-800/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApiKeysSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-4">
      <div className="flex items-center justify-between rounded-xs border border-border/60 bg-zinc-950/40 p-5">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 bg-zinc-800/80" />
          <Skeleton className="h-4 w-64 bg-zinc-800/50" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xs bg-zinc-800/80" />
      </div>
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 divide-y divide-border/40">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xs bg-zinc-800/70" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-zinc-800/80" />
                <Skeleton className="h-3 w-48 bg-zinc-800/40" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full bg-zinc-800/50" />
              <Skeleton className="h-8 w-8 rounded-xs bg-zinc-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 p-4">
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 p-5 space-y-2">
        <Skeleton className="h-6 w-36 bg-zinc-800/80" />
        <Skeleton className="h-4 w-72 bg-zinc-800/50" />
      </div>
      <div className="rounded-xs border border-border/60 bg-zinc-950/40 divide-y divide-border/40">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full bg-zinc-800/70" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-56 bg-zinc-800/80" />
                <Skeleton className="h-3 w-40 bg-zinc-800/40" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded bg-zinc-800/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
