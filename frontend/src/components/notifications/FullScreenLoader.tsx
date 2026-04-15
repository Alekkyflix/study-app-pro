import React from 'react';
import { motion } from 'framer-motion';

interface FullScreenLoaderProps {
  message?: string;
  progress?: number;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ message, progress }) => {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-white/40 backdrop-blur-xl">
      <div className="relative mb-12">
        {/* Pulsing Outer Rings */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 bg-gray-900 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-16 bg-gray-900 rounded-full"
        />
        
        {/* Core Logo */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-24 h-24 bg-gray-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl"
        >
          <span className="text-4xl font-black text-white italic">S</span>
        </motion.div>
      </div>

      <div className="text-center px-6 max-w-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">StudyPro</h2>
        <p className="text-gray-500 font-medium h-6">
          {message || 'Thinking...'}
        </p>

        {progress !== undefined && (
          <div className="mt-8 w-64 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto border border-gray-50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gray-900"
            />
          </div>
        )}
      </div>

      <div className="absolute bottom-12 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 bg-gray-300 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

export default FullScreenLoader;
