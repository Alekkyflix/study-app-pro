import React from 'react';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h3 className="px-5 text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-3 ml-1">
        {title}
      </h3>
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingSection;
