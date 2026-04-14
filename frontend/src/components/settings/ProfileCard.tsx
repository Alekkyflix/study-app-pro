import React from 'react';
import { Camera, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileCardProps {
  name: string;
  email: string;
  university: string;
  yearOfStudy?: string;
  joinedDate: string;
  avatarUrl?: string;
  onEdit: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  university,
  yearOfStudy,
  joinedDate,
  avatarUrl,
  onEdit
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-8 mb-10 relative overflow-hidden shadow-2xl">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-3xl font-black text-white italic shadow-lg border-2 border-white/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-[2rem]" />
            ) : (
              initials
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4 text-gray-900" />
          </button>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{name}</h2>
          <p className="text-gray-400 font-medium text-sm mb-3">{email}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none mb-1">Institution</p>
              <p className="text-xs font-bold text-white leading-none">{university || 'Not Specified'}</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Member Since</p>
              <p className="text-xs font-bold text-white leading-none">
                {new Date(joinedDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onEdit}
          className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-xl active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;
