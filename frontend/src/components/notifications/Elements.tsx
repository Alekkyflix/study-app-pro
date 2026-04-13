import React from 'react';
import { motion } from 'framer-motion';
import { Search, FolderOpen, FileText, Sparkles, Mic } from 'lucide-react';

/**
 * Inline Loader for buttons
 */
export const InlineLoader: React.FC = () => (
  <div className="flex gap-1 items-center justify-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
        className="w-1.5 h-1.5 bg-current rounded-full"
      />
    ))}
  </div>
);

/**
 * Skeleton Screen components
 */
export const SkeletonRect: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-100 rounded-xl ${className}`}>
    <motion.div
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
    />
  </div>
);

export const LectureSkeleton: React.FC = () => (
  <div className="p-4 border border-gray-100 rounded-3xl bg-white space-y-3">
    <div className="flex justify-between items-start">
      <SkeletonRect className="w-1/2 h-5" />
      <SkeletonRect className="w-20 h-4" />
    </div>
    <SkeletonRect className="w-full h-4" />
    <div className="flex gap-2">
      <SkeletonRect className="w-24 h-8 rounded-full" />
      <SkeletonRect className="w-24 h-8 rounded-full" />
    </div>
  </div>
);

/**
 * Empty States
 */
interface EmptyStateProps {
  type: 'lectures' | 'transcript' | 'summary' | 'search';
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
  const configs = {
    lectures: {
      icon: <Mic className="w-12 h-12 text-gray-300" />,
      title: "No lectures yet",
      description: "Tap the record button to capture your first lecture",
    },
    transcript: {
      icon: <FileText className="w-12 h-12 text-gray-300" />,
      title: "Transcript not available",
      description: "Upload or record audio to generate a transcript",
    },
    summary: {
      icon: <Sparkles className="w-12 h-12 text-gray-300" />,
      title: "No summary yet",
      description: "Generate a summary from your transcript",
    },
    search: {
      icon: <Search className="w-12 h-12 text-gray-300" />,
      title: "No lectures found",
      description: "Try a different search term",
    },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100">
        {configs.icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{configs.title}</h3>
      <p className="text-gray-500 max-w-xs mb-8">{configs.description}</p>
      
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

/**
 * Recording Status Indicator
 */
export const RecordingIndicator: React.FC<{ duration: string }> = ({ duration }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"
    />
    <span className="font-mono font-bold text-sm tracking-wider">
      Recording... {duration}
    </span>
  </div>
);

/**
 * Onboarding Tooltip
 */
export const OnboardingTooltip: React.FC<{ 
  message: string; 
  onDismiss: () => void;
  className?: string;
}> = ({ message, onDismiss, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={`absolute z-[50] flex flex-col items-center ${className}`}
  >
    <div className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-medium relative max-w-[200px] text-center">
      {message}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
    </div>
    <div className="absolute -inset-4 ring-2 ring-gray-900/20 rounded-full animate-pulse -z-10" />
    <button 
      onClick={onDismiss}
      className="absolute inset-0 w-full h-full cursor-pointer"
      title="Dismiss"
    />
  </motion.div>
);
