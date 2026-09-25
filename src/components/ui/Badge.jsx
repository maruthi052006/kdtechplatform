import React from 'react';

export const Badge = ({
  children,
  variant = 'cyan',
  size = 'sm',
  className = '',
}) => {
  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const variants = {
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
