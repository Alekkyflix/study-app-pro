import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast, NotificationType } from '../../context/NotificationContext';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  // Position: bottom-left on desktop, bottom-center on mobile (above nav bar)
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: window.innerWidth >= 640 ? '24px' : '80px',
    left: window.innerWidth >= 640 ? '16px' : '50%',
    transform: window.innerWidth >= 640 ? 'none' : 'translateX(-50%)',
    width: window.innerWidth >= 640 ? '360px' : 'calc(100vw - 32px)',
    maxWidth: '360px',
    zIndex: 9999,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const colorMap: Record<NotificationType, { bar: string; border: string; icon: React.ReactNode }> = {
  success: {
    bar: '#22c55e',
    border: '#22c55e',
    icon: <CheckCircle2 style={{ width: 20, height: 20, color: '#22c55e' }} />,
  },
  error: {
    bar: '#ef4444',
    border: '#ef4444',
    icon: <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />,
  },
  warning: {
    bar: '#f59e0b',
    border: '#f59e0b',
    icon: <AlertCircle style={{ width: 20, height: 20, color: '#f59e0b' }} />,
  },
  info: {
    bar: '#3b82f6',
    border: '#3b82f6',
    icon: <Info style={{ width: 20, height: 20, color: '#3b82f6' }} />,
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const { bar, border, icon } = colorMap[toast.type];
  const title = toast.title || (toast.type.charAt(0).toUpperCase() + toast.type.slice(1));

  // Start the progress bar animation one frame after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (barRef.current) barRef.current.style.width = '0%';
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
      style={{
        pointerEvents: 'auto',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        borderLeft: `4px solid ${border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Content */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 14px 12px 14px' }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
              {title}
            </p>
          )}
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#4b5563', lineHeight: 1.4 }}>
            {toast.message}
          </p>
          {toast.type === 'error' && toast.retry && (
            <button
              onClick={() => { toast.retry!(); onRemove(); }}
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#dc2626',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Try Again
            </button>
          )}
        </div>

        <button
          onClick={onRemove}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 999,
            color: '#9ca3af',
            lineHeight: 1,
          }}
          aria-label="Dismiss"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#f3f4f6' }}>
        <div
          ref={barRef}
          style={{
            height: '100%',
            width: '100%',
            background: bar,
            transition: `width ${toast.duration}ms linear`,
            willChange: 'width',
          }}
        />
      </div>
    </motion.div>
  );
};

export default ToastContainer;
