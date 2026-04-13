import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ModalOptions } from '../../context/NotificationContext';

interface ModalProps extends ModalOptions {
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'default',
  onConfirm,
  onCancel,
  onClose,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 pt-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 rotate-6 transform transition-transform hover:rotate-0">
               <span className="text-2xl font-bold text-gray-900">S</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-8 px-4 leading-relaxed">
            {body}
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              className={`
                w-full py-3.5 rounded-2xl font-bold transition-all
                ${confirmStyle === 'destructive' 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95' 
                  : 'bg-gray-900 text-white hover:bg-black active:scale-95'
                }
              `}
            >
              {confirmText}
            </button>
            
            <button
              onClick={handleCancel}
              className="w-full py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </motion.div>
    </div>
  );
};

export default Modal;
