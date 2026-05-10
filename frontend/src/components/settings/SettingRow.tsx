import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: string | number | boolean;
  type?: 'toggle' | 'select' | 'slider' | 'color' | 'nav' | 'danger';
  options?: { label: string; value: any }[];
  onChange?: (val: any) => void;
  onClick?: () => void;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon: Icon,
  label,
  description,
  value,
  type = 'nav',
  options = [],
  onChange,
  onClick,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div 
      onClick={type !== 'select' ? onClick : undefined}
      className={`
        flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${type === 'danger' ? 'bg-red-50 dark:bg-red-950 text-red-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold tracking-tight ${type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} leading-none mb-1`}>
            {label}
          </p>
          {description && (
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 line-clamp-1 italic">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {type === 'toggle' && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange?.(!value); }}
            className={`
              w-12 h-6 rounded-full transition-all relative
              ${value ? 'bg-accent-primary shadow-inner' : 'bg-gray-200 dark:bg-gray-700'}
            `}
          >
            <motion.div
              animate={{ x: value ? 26 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        )}

        {type === 'select' && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 px-4 py-2 rounded-2xl transition-all active:scale-95 shadow-sm"
            >
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {options.find(o => o.value === value)?.label || value}
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 p-1"
                >
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange?.(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        value === opt.value 
                          ? 'bg-accent-primary text-white shadow-md' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {type === 'nav' && (
          <div className="flex items-center gap-2">
            {value !== undefined && <span className="text-sm font-bold text-gray-400 dark:text-gray-500">{value}</span>}
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {type === 'danger' && (
           <ChevronRight className="w-4 h-4 text-red-200 dark:text-red-900" />
        )}
      </div>
    </div>
  );
};

export default SettingRow;
