import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

interface ConsentReminderProps {
  onConfirm: () => void;
  onClose: () => void;
}

const ConsentReminder: React.FC<ConsentReminderProps> = ({ onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 z-[115] flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
             <ClipboardCheck className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            Quick reminder <span className="text-2xl ml-1">📋</span>
          </h3>
        </div>
        
        <p className="text-gray-600 mb-8 leading-relaxed text-lg">
          Make sure you have <span className="font-bold text-gray-900">permission</span> to record this session from everyone involved.
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onConfirm}
            className="w-full py-4 px-6 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] premium-shadow"
          >
            Got it, start recording
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <a
            href="#"
            className="text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => { e.preventDefault(); /* Show details */ }}
          >
            Learn more about consent
          </a>
        </div>

        {/* Swipe Handle for Mobile Feel */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full" />
      </motion.div>
    </div>
  );
};

export default ConsentReminder;
