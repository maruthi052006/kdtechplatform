import React from 'react';

export const SkeletonLoader = ({ count = 3, type = 'card' }) => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-6 w-16 bg-slate-800 rounded-full" />
          </div>
          <div className="h-3 bg-slate-800/60 rounded w-3/4" />
          <div className="h-3 bg-slate-800/40 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};
