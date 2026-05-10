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
      <div className="glass-card rounded-[2rem] premium-shadow">
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingSection;
