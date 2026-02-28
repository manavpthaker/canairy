import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0C] animate-pulse">
      {/* Sidebar placeholder */}
      <div className="fixed left-0 top-0 bottom-0 w-56 bg-white/[0.03] border-r border-white/[0.04] hidden lg:block">
        <div className="p-6 space-y-4">
          <div className="h-8 w-32 bg-white/5 rounded" />
          <div className="space-y-2 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content placeholder */}
      <div className="lg:ml-56 p-6 lg:p-12">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/5 rounded mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 glass-card" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="h-64 glass-card mb-6" />
        <div className="h-48 glass-card" />
      </div>
    </div>
  );
};
