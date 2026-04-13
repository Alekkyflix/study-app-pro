import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Loader } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading: authLoading, requireOnboarding } = useAuth();
  const { profile, loading: settingsLoading } = useSettings();
  const location = useLocation();

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow Onboarding first
  if (requireOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Force Consent if not given
  if (profile && !profile.recording_consent && location.pathname !== '/consent') {
    return <Navigate to="/consent" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
