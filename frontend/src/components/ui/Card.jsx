import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) => {
  const hoverClasses = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-slate-700/80 transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-lg ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
