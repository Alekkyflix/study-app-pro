import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowRight } from 'lucide-react';

export function EmailVerification() {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('studypro_verification_email');
    if (stored) setEmail(stored);

    const checkVerification = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/'; // Auto auth redirect
      }
    });

    return () => {
      checkVerification.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      setMessage("Verification email resent!");
      setCooldown(60);
    } catch (err: any) {
      setMessage("Could not resend at this time.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-6 text-gray-900 text-center">
      <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-8 border-8 border-white shadow-xl">
        <Mail className="w-10 h-10" />
      </div>

      <h2 className="text-3xl font-extrabold tracking-tighter mb-4">Check your email</h2>
      
      <p className="text-gray-500 font-medium mb-8 max-w-sm leading-relaxed">
        We sent a verification link to <strong className="text-gray-900">{email || "your email"}</strong>
      </p>

      {message && <div className="text-sm font-bold text-green-600 mb-6">{message}</div>}

      <button 
        onClick={handleResend}
        disabled={cooldown > 0}
        className="px-8 py-4 bg-white border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
      </button>

      <Link to="/signup" className="text-sm font-bold text-gray-400 hover:text-gray-900 flex items-center gap-2">
        Change email address <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
