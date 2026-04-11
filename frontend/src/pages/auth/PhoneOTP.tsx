import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Phone, Loader } from 'lucide-react';

export function PhoneOTP() {
  const [phone, setPhone] = useState('+254');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.match(/^\+254\d{9}$/)) {
      setError("Phone must be in +254XXXXXXXXX format");
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;
      setStep('VERIFY');
      setCooldown(60);
    } catch (err: any) {
      setError(err.status === 429 ? "Too many attempts. Please wait 15 minutes before trying again." : err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms'
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError("Invalid code provided");
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit
    if (index === 5 && value) {
      const code = newOtp.join('');
      if (code.length === 6) verifyOtp(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center p-6 text-gray-900">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-gray-900" />
          </div>
        </div>

        {step === 'REQUEST' ? (
          <>
            <h2 className="text-3xl font-extrabold tracking-tighter text-center mb-8">Sign in with Phone</h2>
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">{error}</div>}

            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-2 ml-1">Phone Number</label>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium text-lg tracking-widest text-center"
                  placeholder="+254700000000"
                />
              </div>
              <button 
                type="submit" disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold tracking-tight hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Send Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold tracking-tighter text-center mb-4">Enter Code</h2>
            <p className="text-center text-gray-500 font-medium mb-8">Enter the code sent to <strong className="text-gray-900">{phone}</strong></p>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">{error}</div>}

            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-16 md:w-14 md:h-18 text-center text-2xl font-bold bg-white border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-2 focus:ring-gray-900 outline-none transition"
                />
              ))}
            </div>

            <div className="text-center">
              <button 
                onClick={() => handleSendOTP()}
                disabled={cooldown > 0 || loading}
                className="text-sm font-bold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}

        <div className="mt-12 text-center">
          <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-gray-900">
            Back to Email Login
          </Link>
        </div>
      </div>
    </div>
  );
}
