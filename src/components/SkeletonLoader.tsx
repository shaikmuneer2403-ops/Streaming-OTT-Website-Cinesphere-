import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full space-y-8 animate-fade-in pb-16">
      {/* Hero Banner Skeleton */}
      <div className="relative w-full h-[60vh] min-h-[480px] max-h-[640px] bg-[#111726] overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/40 to-transparent" />
        <div className="absolute bottom-10 left-4 sm:left-8 right-4 sm:right-8 max-w-2xl space-y-4">
          <div className="flex gap-2">
            <div className="w-16 h-6 rounded-md bg-white/10" />
            <div className="w-20 h-6 rounded-md bg-white/10" />
            <div className="w-28 h-6 rounded-md bg-white/10" />
          </div>
          <div className="w-3/4 sm:w-1/2 h-10 sm:h-14 rounded-xl bg-white/10" />
          <div className="w-full sm:w-4/5 h-4 rounded bg-white/10" />
          <div className="w-2/3 h-4 rounded bg-white/10" />
          <div className="flex gap-3 pt-2">
            <div className="w-32 h-11 rounded-lg bg-red-600/40" />
            <div className="w-32 h-11 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>

      {/* Row Skeletons */}
      {[1, 2, 3].map((row) => (
        <div key={row} className="space-y-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="w-48 h-6 rounded-md bg-white/10" />
            <div className="w-12 h-4 rounded-full bg-white/5" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <div
                key={card}
                className="flex-shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-xl bg-[#151c2e] overflow-hidden relative"
              >
                <div className="absolute inset-0 animate-shimmer" />
                <div className="absolute top-2 left-2 w-10 h-4 rounded bg-white/10" />
                <div className="absolute bottom-2 left-2 right-2 space-y-1">
                  <div className="w-3/4 h-3 rounded bg-white/10" />
                  <div className="w-1/2 h-2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
