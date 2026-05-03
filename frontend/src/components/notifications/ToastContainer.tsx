import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast, NotificationType } from '../../context/NotificationContext';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-24 md:bottom-6 left-0 right-0 z-[100] px-4 pointer-events-none flex flex-col items-center gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const colorMap: Record<NotificationType, { bar: string; icon: React.ReactNode; border: string }> = {
  success: {
    bar: 'bg-green-500',
    border: 'border-l-green-500',
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  },
  error: {
    bar: 'bg-red-500',
    border: 'border-l-red-500',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
  warning: {
    bar: 'bg-amber-500',
    border: 'border-l-amber-500',
    icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
  },
  info: {
    bar: 'bg-blue-500',
    border: 'border-l-blue-500',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const { bar, border, icon } = colorMap[toast.type];
  const title = toast.title || (toast.type.charAt(0).toUpperCase() + toast.type.slice(1));

  // Kick off the CSS width animation one frame after mount so the transition runs
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (barRef.current) {
        barRef.current.style.width = '0%';
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95, transition: { duration: 0.18 } }}
      className={`
        pointer-events-auto
        w-full max-w-sm
        bg-white rounded-2xl overflow-hidden
        border border-gray-100 border-l-4 ${border}
        shadow-xl shadow-black/8
      `}
    >
      {/* Content row */}
      <div className="flex gap-3 items-start p-4">
        <div className="mt-0.5 shrink-0">{icon}</div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-bold text-gray-900 leading-tight">{title}</h4>
          )}
          <p className="text-sm text-gray-600 mt-0.5 leading-snug">{toast.message}</p>

          {toast.type === 'error' && toast.retry && (
            <button
              onClick={() => { toast.retry!(); onRemove(); }}
              className="mt-2 text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-2"
            >
              Try Again
            </button>
          )}
        </div>

        <button
          onClick={onRemove}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Progress bar — shrinks from full width to 0 over toast.duration ms */}
      <div className="h-0.5 bg-gray-100 w-full">
        <div
          ref={barRef}
          className={`h-full ${bar} w-full`}
          style={{
            transition: `width ${toast.duration}ms linear`,
            willChange: 'width',
          }}
        />
      </div>
    </motion.div>
  );
};

export default ToastContainer;
