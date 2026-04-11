import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { KeyRound, ArrowLeft, Loader } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('LOADING');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setStatus('SUCCESS');
      setMessage("Check your email for reset instructions");
    } catch (err: any) {
      setStatus('ERROR');
      setMessage(err.message || "Failed to send reset link");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center p-6 text-gray-900">
      <div className="max-w-md w-full mx-auto">
        <Link to="/login" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center mb-8 hover:bg-gray-50 transition">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </Link>
        
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <KeyRound className="w-8 h-8 text-gray-900" />
        </div>
        
        <h2 className="text-3xl font-extrabold tracking-tighter mb-3">Reset password</h2>
        <p className="text-gray-500 font-medium mb-8">Enter your email and we'll send you a link to completely restore access to your account.</p>

        {status === 'SUCCESS' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium border border-green-100 flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             {message}
          </div>
        )}
        
        {status === 'ERROR' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {message}
          </div>
        )}

        {status !== 'SUCCESS' && (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-2 ml-1">Email Address</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                placeholder="you@university.ac.ke"
              />
            </div>
            <button 
              type="submit" disabled={status === 'LOADING'}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold tracking-tight hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center"
            >
              {status === 'LOADING' ? <Loader className="w-5 h-5 animate-spin" /> : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
