import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
      `}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold tracking-tight ${type === 'danger' ? 'text-red-600' : 'text-gray-900'} leading-none mb-1`}>
            {label}
          </p>
          {description && (
            <p className="text-xs font-medium text-gray-400 line-clamp-1 italic">
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
              ${value ? 'bg-gray-900 shadow-inner' : 'bg-gray-200'}
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
          <select
            value={value as string}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange?.(e.target.value)}
            className="bg-transparent text-sm font-bold text-gray-900 border-none focus:ring-0 cursor-pointer text-right appearance-none pr-0"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {type === 'nav' && (
          <div className="flex items-center gap-2">
            {value !== undefined && <span className="text-sm font-bold text-gray-400">{value}</span>}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        )}

        {type === 'danger' && (
           <ChevronRight className="w-4 h-4 text-red-200" />
        )}
      </div>
    </div>
  );
};

export default SettingRow;
