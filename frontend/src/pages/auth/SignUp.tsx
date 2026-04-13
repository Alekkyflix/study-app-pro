import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BookOpen, Eye, EyeOff, Loader, Github } from 'lucide-react';

export function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [termsConsent, setTermsConsent] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError(null);

    // Validation
    if (fullName.length < 2) return setError("Full name must be at least 2 characters");
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError("Please enter a valid email address");
    if (!phone.match(/^\+254\d{9}$/)) return setError("Phone must be in +254XXXXXXXXX format");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return setError("Password must be at least 8 characters with 1 uppercase and 1 number");
    }
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (!termsConsent || !recordingConsent) return setError("You must agree to all consents to proceed");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            institution: institution,
            recording_consent: recordingConsent
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError("This email is already registered. Try logging in instead.");
        } else {
          throw error;
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('rate limit')) {
         setError("You've tried to sign up too many times recently. Supabase limits verification emails to prevent spam. Please wait an hour or adjust your Auth settings in the Supabase Dashboard.");
      } else {
         setError(err.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center p-6 text-gray-900 overflow-y-auto pt-16 pb-16">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/50">
        <div className="flex justify-center mb-6">
          <BookOpen className="w-8 h-8 text-gray-900" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tighter text-center mb-8">Create your account</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Full Name</label>
            <input 
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Email Address</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
              placeholder="you@university.ac.ke"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Phone Number</label>
            <input 
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
              placeholder="+254700000000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Institution (Optional)</label>
            <select 
              value={institution} onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
            >
              <option value="">Select your university</option>
              <option value="UoN">University of Nairobi</option>
              <option value="KU">Kenyatta University</option>
              <option value="Strathmore">Strathmore University</option>
              <option value="JKUAT">JKUAT</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Password</label>
            <input 
              type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium pr-12"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div className="flex gap-1 mt-2 px-1">
              <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 ? (password.length >= 8 ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'}`}></div>
              <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 ? (/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'}`}></div>
              <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 ? (/[0-9]/.test(password) ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'}`}></div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1 px-1">8+ Chars • uppercase • number</p>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-1 ml-1">Confirm Password</label>
            <input 
              type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium pr-12"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-6 space-y-3 pt-4 border-t border-gray-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-gray-900 focus:ring-gray-900 rounded"
              />
              <span className="text-sm font-medium text-gray-600">I agree to the Terms of Service and Privacy Policy</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" checked={recordingConsent} onChange={(e) => setRecordingConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-gray-900 focus:ring-gray-900 rounded"
              />
              <span className="text-sm font-medium text-gray-600">I understand I must obtain permission before recording any lecture</span>
            </label>
          </div>

          <button 
            type="button" onClick={handleSignUp} disabled={loading}
            className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-bold tracking-tight hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="mt-8 space-y-4">
          <button 
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all flex justify-center items-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>

          <button 
            type="button"
            onClick={() => handleOAuth('github')}
            className="w-full py-4 bg-[#24292e] border border-[#24292e] rounded-2xl font-bold text-white hover:bg-black transition-all flex justify-center items-center gap-3"
          >
            <Github className="w-5 h-5" />
            GitHub
          </button>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Already have an account? <Link to="/login" className="text-gray-900 font-bold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
