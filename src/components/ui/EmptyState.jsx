import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-base sm:text-lg font-bold text-white">{title}</h4>
      {description && (
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
