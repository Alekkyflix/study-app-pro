import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Chat } from "./pages/Chat";
import { Reports } from "./pages/Reports";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";

import { Splash } from "./pages/auth/Splash";
import { Onboarding } from "./pages/auth/Onboarding";
import { Login } from "./pages/auth/Login";
import { SignUp } from "./pages/auth/SignUp";
import { EmailVerification } from "./pages/auth/EmailVerification";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Header />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public / Auth Routes */}
              <Route path="/splash" element={<Splash />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected App Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Splash />} />
            </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;