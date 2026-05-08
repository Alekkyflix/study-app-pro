import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import ToastContainer from '../components/notifications/ToastContainer';
import Modal from '../components/notifications/Modal';
import FullScreenLoader from '../components/notifications/FullScreenLoader';
import ConsentReminder from '../components/notifications/ConsentReminder';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  retry?: () => void;
  duration: number;  // ms — used by the progress bar
}

export interface ModalOptions {
  title: string;
  body: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface NotificationContextType {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string, options?: { retry?: () => void }) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showModal: (options: ModalOptions) => void;
  showMiniToast: (message: string) => void;
  setLoading: (isLoading: boolean, message?: string, progress?: number) => void;
  showConsent: (onConfirm: () => void, mode?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modal, setModal] = useState<ModalOptions | null>(null);
  const [loading, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [consentVisible, setConsentVisible] = useState(false);
  const [onConsentConfirm, setOnConsentConfirm] = useState<(() => void) | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: NotificationType, title: string, message: string, retry?: () => void) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Errors with retry get 8 s so the user has time to act; everything else 5 s
    const duration = (type === 'error' && retry) ? 8000 : 5000;
    const newToast: Toast = { id, type, title, message, retry, duration };
    setToasts((prev) => [...prev, newToast]);
    // Always auto-dismiss — no toast stays on screen indefinitely
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message: string) => {
    addToast('success', title, message);
  }, [addToast]);

  const showError = useCallback((title: string, message: string, options?: { retry?: () => void }) => {
    addToast('error', title, message, options?.retry);
  }, [addToast]);

  const showWarning = useCallback((title: string, message: string) => {
    addToast('warning', title, message);
  }, [addToast]);

  const showInfo = useCallback((title: string, message: string) => {
    addToast('info', title, message);
  }, [addToast]);

  const showMiniToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type: 'success', title: '', message, duration: 1200 };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => removeToast(id), 1200);
  }, [removeToast]);

  const showModal = useCallback((options: ModalOptions) => {
    setModal(options);
  }, []);

  const setLoading = useCallback((isLoading: boolean, message?: string, progress?: number) => {
    setLoadingState({ isLoading, message, progress });
  }, []);

  const showConsent = useCallback((onConfirm: () => void, mode = 'always') => {
    if (mode === 'never') {
      onConfirm();
      return;
    }
    const consentCount = parseInt(localStorage.getItem('studypro_consent_count') || '0');
    if (mode === 'always' || (mode === '3_times' && consentCount < 3)) {
      setOnConsentConfirm(() => onConfirm);
      setConsentVisible(true);
    } else {
      onConfirm();
    }
  }, []);

  const handleConsentConfirm = () => {
    const consentCount = parseInt(localStorage.getItem('studypro_consent_count') || '0');
    localStorage.setItem('studypro_consent_count', (consentCount + 1).toString());
    setConsentVisible(false);
    onConsentConfirm?.();
  };

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showModal,
        showMiniToast,
        setLoading,
        showConsent,
      }}
    >
      {children}
      
      {/* Portals / Fixed elements */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AnimatePresence>
        {modal && (
          <Modal
            key="modal"
            {...modal}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading.isLoading && (
          <FullScreenLoader
            key="loader"
            message={loading.message}
            progress={loading.progress}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {consentVisible && (
          <ConsentReminder
            key="consent"
            onConfirm={handleConsentConfirm}
            onClose={() => setConsentVisible(false)}
          />
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
