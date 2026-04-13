import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';
import { Shield, Check, AlertCircle, FileText, Scale, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Consent() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const handleConsent = async () => {
    if (!agreed || !user) return;
    
    setLoading(true);
    try {
      // 1. Update the database record (Upsert ensures it's created if it doesn't exist)
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          recording_consent: true,
          updated_at: new Date().toISOString()
        });
      
      if (dbError) throw dbError;

      // 2. Backup: Update auth metadata as well
      await supabase.auth.updateUser({
        data: { recording_consent: true }
      });

      // 3. Mark as onboarded/contented in local storage
      localStorage.setItem('studypro_consent_given', 'true');
      
      showSuccess("Consent Recorded", "You are now authorized to use StudyPro features.");
      navigate('/');
    } catch (err: any) {
      console.error('Consent error:', err);
      showError("Sync Failed", "We couldn't save your consent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 text-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
              <Scale className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Legal Consent</h1>
            <p className="text-gray-500 font-medium">Please review our recording policy</p>
          </div>

          {/* Legal Form */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                    <Shield className="w-4 h-4" /> 1. Recording Permission
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                    You acknowledge that you must obtain explicit verbal or written permission from the instructor or lecturer before recording any academic session. Unauthorized recording may violate local laws (including Kenyan Privacy Acts) and institutional policies.
                  </p>
                </section>
                
                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                    <Lock className="w-4 h-4" /> 2. Data Usage
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                    Recordings are processed by AI (Gemini/Whisper) to provide transcripts. By proceeding, you consent to this processing. Your data is private and encrypted, accessible only to you.
                  </p>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                    <AlertCircle className="w-4 h-4" /> 3. Responsible Use
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                    StudyPro is designed for academic enhancement. Sharing sensitive or private content without permission is strictly prohibited.
                  </p>
                </section>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl cursor-pointer group transition-colors hover:bg-blue-50">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="peer w-6 h-6 opacity-0 absolute cursor-pointer"
                />
                <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center
                  ${agreed ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}>
                  {agreed && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  I have read and agree to the recording terms.
                </p>
                <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider mt-0.5">
                  This confirmation will be stored with your profile
                </p>
              </div>
            </label>

            {/* Action */}
            <button 
              onClick={handleConsent}
              disabled={!agreed || loading}
              className={`
                w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl
                ${agreed 
                  ? 'bg-gray-900 text-white hover:bg-black active:scale-[0.98] shadow-gray-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}
              `}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  Accept & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
        StudyPro Compliance Engine v1.0
      </p>
    </div>
  );
}
