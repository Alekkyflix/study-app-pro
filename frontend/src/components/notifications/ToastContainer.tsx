import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast, NotificationType } from '../../context/NotificationContext';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borderColors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  const titles = {
    success: toast.title || 'Success',
    error: toast.title || 'Error',
    warning: toast.title || 'Warning',
    info: toast.title || 'Note',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
      className={`
        pointer-events-auto
        w-full max-w-sm
        glass-card
        border-l-4 ${borderColors[toast.type]}
        p-4 flex gap-3 items-start
        premium-shadow
      `}
    >
      <div className="mt-0.5">
        {icons[toast.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 leading-tight">
          {titles[toast.type]}
        </h4>
        <p className="text-sm text-gray-600 mt-0.5">
          {toast.message}
        </p>
        
        {toast.type === 'error' && toast.retry && (
          <button
            onClick={toast.retry}
            className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-2"
          >
            Try Again
          </button>
        )}
      </div>

      <button
        onClick={onRemove}
        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
};

export default ToastContainer;
