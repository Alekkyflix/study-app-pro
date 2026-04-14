import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Lock, Loader, CheckCircle } from 'lucide-react';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setStatus('LOADING');
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setStatus('SUCCESS');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus('ERROR');
      setError(err.message || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center p-6 text-gray-900">
      <div className="max-w-md w-full mx-auto">
        <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-3xl font-extrabold tracking-tighter mb-3">New Password</h2>
        <p className="text-gray-500 font-medium mb-8">Enter a fresh, secure password to regain full access to your account.</p>

        {status === 'SUCCESS' ? (
          <div className="bg-green-50 border border-green-100 p-6 rounded-3xl text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-green-900 font-bold mb-2">Password Updated!</h3>
            <p className="text-green-700 text-sm">You'll be redirected to the login page in a moment...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-2 ml-1">New Password</label>
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-2 ml-1">Confirm New Password</label>
              <input 
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" disabled={status === 'LOADING'}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold tracking-tight hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center shadow-xl shadow-gray-200"
            >
              {status === 'LOADING' ? <Loader className="w-5 h-5 animate-spin" /> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
