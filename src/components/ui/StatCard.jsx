import React from 'react';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  trend,
  trendType = 'positive',
  accentColor = 'cyan',
}) => {
  const accents = {
    cyan: 'from-cyan-500/10 to-blue-500/5 text-cyan-400 border-cyan-500/20',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-400 border-amber-500/20',
    indigo: 'from-indigo-500/10 to-purple-500/5 text-indigo-400 border-indigo-500/20',
    rose: 'from-rose-500/10 to-pink-500/5 text-rose-400 border-rose-500/20',
  };

  return (
    <Card className="relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${accents[accentColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        {subvalue && <span className="text-xs text-slate-400">{subvalue}</span>}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trendType === 'positive' ? (
            <span className="text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          ) : (
            <span className="text-rose-400 flex items-center font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
          <span className="text-slate-500">vs last cohort</span>
        </div>
      )}
    </Card>
  );
};
