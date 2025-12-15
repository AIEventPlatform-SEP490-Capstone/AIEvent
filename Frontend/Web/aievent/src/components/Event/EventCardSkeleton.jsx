// Skeleton component for loading states with shimmer effect
const EventCardSkeleton = ({ count = 3, viewMode = 'list' }) => {
  const SkeletonPulse = ({ className }) => (
    <div className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-700/80 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );

  if (viewMode === 'compact') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-lg"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Image skeleton */}
            <SkeletonPulse className="w-full h-40 rounded-t-2xl" />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <SkeletonPulse className="h-5 rounded-lg w-4/5" />
              <div className="flex gap-3">
                <SkeletonPulse className="h-4 rounded w-24" />
                <SkeletonPulse className="h-4 rounded w-20" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-2">
                    <SkeletonPulse className="h-3 rounded w-12 mx-auto mb-1.5" />
                    <SkeletonPulse className="h-4 rounded w-8 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-lg"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Image skeleton */}
            <div className="relative flex-shrink-0 lg:w-[420px] w-full h-56 lg:h-auto lg:min-h-[280px] overflow-hidden">
              <SkeletonPulse className="w-full h-full" />
              {/* Fake status badge */}
              <div className="absolute top-4 right-4">
                <SkeletonPulse className="h-7 w-24 rounded-full" />
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 p-6 lg:p-8 space-y-5">
              {/* Title and badge row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-7 rounded-xl w-3/4" />
                  <SkeletonPulse className="h-4 rounded-lg w-1/2" />
                </div>
                <SkeletonPulse className="h-8 w-28 rounded-full flex-shrink-0" />
              </div>
              
              {/* Details row */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="w-5 h-5 rounded-full" />
                  <SkeletonPulse className="h-4 rounded w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="w-5 h-5 rounded-full" />
                  <SkeletonPulse className="h-4 rounded w-36" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="w-5 h-5 rounded-full" />
                  <SkeletonPulse className="h-4 rounded w-20" />
                </div>
              </div>
              
              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-gradient-to-br from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-800/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <SkeletonPulse className="h-3 rounded w-14 mx-auto mb-2" />
                    <SkeletonPulse className="h-5 rounded-lg w-10 mx-auto" />
                  </div>
                ))}
              </div>
              
              {/* Actions row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex gap-2">
                  <SkeletonPulse className="h-6 w-16 rounded-full" />
                  <SkeletonPulse className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonPulse key={i} className="h-10 w-10 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventCardSkeleton;
