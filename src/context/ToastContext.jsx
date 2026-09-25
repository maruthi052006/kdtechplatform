// Professional Toast Notification System
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message) => addToast({ title, message, type: 'success' }), [addToast]);
  const error = useCallback((title, message) => addToast({ title, message, type: 'error' }), [addToast]);
  const warning = useCallback((title, message) => addToast({ title, message, type: 'warning' }), [addToast]);
  const info = useCallback((title, message) => addToast({ title, message, type: 'info' }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
            };

            const borderColors = {
              success: 'border-emerald-500/30 bg-emerald-950/80',
              error: 'border-rose-500/30 bg-rose-950/80',
              warning: 'border-amber-500/30 bg-amber-950/80',
              info: 'border-cyan-500/30 bg-slate-900/90',
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl text-slate-100 ${borderColors[toast.type]}`}
              >
                {icons[toast.type]}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold leading-tight text-white">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed break-words">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
