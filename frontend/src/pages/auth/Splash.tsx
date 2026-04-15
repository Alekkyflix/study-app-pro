import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { BookOpen } from 'lucide-react';

export function Splash() {
  const navigate = useNavigate();
  const { user, requireOnboarding, loading: authLoading } = useAuth();
  // FIX 1: Also wait for SettingsContext to finish loading the profile.
  // Without this, we might navigate to '/' before the consent check is ready,
  // causing the same flash-then-redirect that was fixed in ProtectedRoute.
  const { profile, loading: settingsLoading } = useSettings();

  useEffect(() => {
    // Block navigation until BOTH auth AND settings have resolved.
    if (authLoading || settingsLoading) return;

    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login');
      } else if (requireOnboarding) {
        navigate('/onboarding');
      } else if (profile !== null && !profile.recording_consent) {
        // Only redirect to consent if profile is LOADED and explicitly has no consent.
        // If profile is null (Supabase fetch returned nothing), treat it as needing consent.
        navigate('/consent');
      } else if (profile === null) {
        // No profile row yet (brand new user) — they need to consent first.
        navigate('/consent');
      } else {
        navigate('/dashboard');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [authLoading, settingsLoading, user, requireOnboarding, profile, navigate]);

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