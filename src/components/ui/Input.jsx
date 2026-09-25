import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input_${label ? label.replace(/\s+/g, '_').toLowerCase() : Math.random()}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-slate-900/80 border ${
            error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'
          } rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all duration-200 outline-none focus:ring-4 ${
            Icon ? 'pl-10' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-400 mt-0.5">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-400 mt-0.5">{helperText}</span>}
    </div>
  );
};
