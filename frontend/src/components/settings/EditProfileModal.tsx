import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    full_name: string;
    phone_number: string;
    university: string;
    course: string;
    year_of_study: string;
  };
  onSave: (data: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave
}) => {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tighter text-gray-900">Edit Profile</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number (+254)</label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Institution</label>
                    <select
                      value={formData.university && ["Meru University", "University of Nairobi", "Kenyatta University", "Strathmore University", "Jomo Kenyatta University", "Moi University"].includes(formData.university) ? formData.university : (formData.university ? "Other" : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, university: val === "Other" ? "" : val });
                      }}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-bold text-sm"
                    >
                      <option value="">Select University</option>
                      <option value="Meru University">Meru University</option>
                      <option value="University of Nairobi">University of Nairobi</option>
                      <option value="Kenyatta University">Kenyatta University</option>
                      <option value="Strathmore University">Strathmore University</option>
                      <option value="Jomo Kenyatta University">JKUAT</option>
                      <option value="Moi University">Moi University</option>
                      <option value="Other">Other (Type manually)</option>
                    </select>

                    {/* Manual Entry Field */}
                    {(!formData.university || !["Meru University", "University of Nairobi", "Kenyatta University", "Strathmore University", "Jomo Kenyatta University", "Moi University"].includes(formData.university)) && (
                      <motion.input
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        type="text"
                        placeholder="Type university name..."
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="w-full px-5 py-3 mt-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-bold text-xs shadow-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Year of Study</label>
                    <select
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-bold text-sm"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-6 h-6" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Swipe Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full sm:hidden" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
