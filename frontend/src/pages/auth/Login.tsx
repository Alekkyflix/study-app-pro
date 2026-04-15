import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BookOpen, Eye, EyeOff, Loader, Github } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);

    // Basic Validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message.includes('Email not confirmed')) {
        setError("Please verify your email before logging in");
      } else if (err.status === 429) {
        setError("Too many attempts. Please wait 15 minutes before trying again.");
      } else {
        setError("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center p-6 text-gray-900">
      <div className="max-w-md w-full mx-auto">
        <div className="flexjustify-center mb-8">
          <BookOpen className="w-10 h-10 text-gray-900 mx-auto" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tighter text-center mb-8">Welcome back</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold tracking-wide uppercase text-gray-500 mb-2 ml-1">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium"
              placeholder="you@university.ac.ke"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2 ml-1 mr-1">
              <label className="block text-xs font-bold tracking-wide uppercase text-gray-500">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-800">Forgot password?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all font-medium pr-12"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold tracking-tight hover:bg-black hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Log In"}
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

        <p className="mt-10 text-center text-sm font-medium text-gray-500">
          Don't have an account? <Link to="/signup" className="text-gray-900 font-bold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
