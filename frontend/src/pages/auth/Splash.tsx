import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen } from 'lucide-react';

export function Splash() {
  const navigate = useNavigate();
  const { user, requireOnboarding, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login');
      } else if (requireOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading, user, requireOnboarding, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-pulse">
        <BookOpen className="w-12 h-12 text-gray-900" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tighter mb-2">StudyPro</h1>
      <p className="text-gray-400 font-medium tracking-tight">Your AI-powered lecture assistant</p>
    </div>
  );
}
