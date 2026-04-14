import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Loader } from 'lucide-react';

export function ProtectedRoute() {
  const { user, loading: authLoading, requireOnboarding } = useAuth();
  const { profile, loading: settingsLoading } = useSettings();
  const location = useLocation();

  // --- FIX 1: Race Condition Guard ---
  // Do NOT render anything until BOTH auth AND settings have fully resolved.
  // This prevents the flash where ProtectedRoute briefly thinks auth is done
  // while SettingsContext is still fetching the profile from Supabase.
  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  // --- Unauthenticated ---
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- Onboarding Gate ---
  if (requireOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // --- FIX 2: Consent Gate handles BOTH cases ---
  // Case A: profile exists in DB and consent is not given.
  // Case B: profile is null (no DB row yet) — this is a NEW user who has
  //         never consented. We must also send them to /consent, not let them through.
  // In both cases, skip the redirect if they are already ON /consent.
  const hasConsented = profile?.recording_consent === true;
  const onConsentPage = location.pathname === '/consent';

  if (!hasConsented && !onConsentPage) {
    return <Navigate to="/consent" replace state={{ from: location }} />;
  }

  return <Outlet />;
}