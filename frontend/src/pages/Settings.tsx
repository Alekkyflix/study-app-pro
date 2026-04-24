import React, { useState } from 'react';
import { 
  User, Palette, Mic, Cpu, Sparkles, Bell, Shield, HardDrive, Info, 
  Moon, Sun, Monitor, Type, Globe, Volume2, Clock, Trash2, 
  LogOut, Key, Link as LinkIcon, ShieldCheck,
  ChevronRight, HelpCircle, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings, AccentColor } from '../context/SettingsContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

import ProfileCard from '../components/settings/ProfileCard';
import SettingSection from '../components/settings/SettingSection';
import SettingRow from '../components/settings/SettingRow';
import EditProfileModal from '../components/settings/EditProfileModal';

export function Settings() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings, profile, updateSetting, updateProfile, loading: settingsLoading } = useSettings();
  const { showModal, showSuccess, showError, showInfo } = useNotification();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  if (settingsLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Settings</p>
        </div>
      </div>
    );
  }

  const handleSignOut = () => {
    showModal({
      title: "Log out of StudyPro?",
      body: "You will need to log in again to access your lectures.",
      confirmText: "Log Out",
      onConfirm: signOut
    });
  };

  const handleDeleteAccount = () => {
    showModal({
      title: "Delete your account?",
      body: "Your account and all data (lectures, transcripts, summaries) will be scheduled for permanent deletion. You have 21 days to cancel by logging back in and contacting support. After 21 days, deletion is irreversible.",
      confirmText: "Schedule Deletion",
      confirmStyle: "destructive",
      onConfirm: async () => {
        try {
          // Mark the account as scheduled for deletion in Supabase
          const { supabase: sb } = await import('../lib/supabase');
          await sb.from('profiles').update({
            deletion_scheduled_at: new Date().toISOString(),
          } as any).eq('id', user?.id ?? '');

          // Sign out and clear local state
          localStorage.clear();
          await signOut();

          // After sign-out, AuthContext will navigate to /login automatically
          showSuccess(
            'Deletion Scheduled',
            'Your account is queued for deletion in 21 days. Log in within 21 days to cancel.'
          );
        } catch {
          showError(
            'Failed',
            'Could not schedule deletion. Please email support@studypro.app.'
          );
        }
      }
    });
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { supabase: sb } = await import('../lib/supabase');
      const { error } = await sb.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showSuccess("Link Sent", "Check your inbox for a password reset link.");
    } catch {
      showError("Failed", "Could not send password reset email.");
    }
  };

  // Wire studyReminders toggle to Push Notification API
  const handleStudyRemindersToggle = async (enabled: boolean) => {
    if (!enabled) {
      updateSetting('studyReminders', false);
      return;
    }
    if (!('Notification' in window)) {
      showInfo('Not Supported', 'Push notifications are not supported in your browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSetting('studyReminders', true);
      showSuccess('Reminders Enabled', 'You will receive study reminders via push notification.');
    } else {
      showError(
        'Permission Denied',
        'Please allow notifications in your browser settings to enable study reminders.',
      );
      // Do not flip the toggle on — permission was denied
    }
  };

  const handleExportData = async () => {
    showInfo('Export Started', 'Compiling your data archive...');
    try {
      const { apiClient } = await import('../services/api');
      const res = await apiClient.getLectures();
      if (!res.success) throw new Error("Could not fetch lectures");
      
      const fullData = await Promise.all((res.lectures || []).map(async (l: any) => {
         const detail = await apiClient.getLecture(l.id);
         return detail.lecture;
      }));
      
      const exportObject = {
         profile,
         settings,
         lectures: fullData
      };
      
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studypro_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Export Complete', 'Your data archive has been downloaded.');
    } catch {
      showError('Export Failed', 'Could not compile your data archive.');
    }
  };

  const accentColors: { name: AccentColor; hex: string }[] = [
    { name: 'blue', hex: '#3b82f6' },
    { name: 'green', hex: '#10b981' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'orange', hex: '#f97316' },
    { name: 'pink', hex: '#ec4899' },
    { name: 'teal', hex: '#14b8a6' },
    { name: 'red', hex: '#ef4444' },
    { name: 'yellow', hex: '#eab308' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-12 text-gray-900 tracking-tight">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-900 rotate-180" />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900">Settings</h1>
            <p className="text-gray-500 font-medium italic">Your study buddy, your rules.</p>
          </div>
        </div>

        {/* Profile Card */}
        <ProfileCard
          name={profile.full_name}
          email={user?.email || ''}
          university={profile.university}
          joinedDate={profile.joined_at}
          onEdit={() => setIsEditProfileOpen(true)}
        />

        {/* Account */}
        <SettingSection title="Account">
          <SettingRow
            icon={Key}
            label="Change Password"
            onClick={handleChangePassword}
          />
          <SettingRow
            icon={ShieldCheck}
            label="Email Verification"
            value="Verified"
            disabled
          />
          <SettingRow
            icon={LogOut}
            label="Sign Out"
            type="danger"
            onClick={handleSignOut}
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection title="Appearance">
          <div className="p-4 border-b border-gray-50 bg-gray-50/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Accent Color</p>
            <div className="flex items-center justify-between px-2">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateSetting('accentColor', color.name)}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 active:scale-90
                    ${settings.accentColor === color.name ? 'ring-4 ring-offset-2 ring-gray-900 scale-110' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          <SettingRow
            icon={settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor}
            label="Theme"
            type="select"
            value={settings.theme}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'System', value: 'system' },
            ]}
            onChange={(val) => updateSetting('theme', val)}
          />

          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-900 flex-1">Font Size</p>
              <span className="text-xs font-black uppercase bg-gray-100 px-2 py-1 rounded-md text-gray-500">
                {settings.fontSize}
              </span>
            </div>
            <input
              type="range" min="0" max="3" step="1"
              value={['small', 'default', 'large', 'extra-large'].indexOf(settings.fontSize)}
              onChange={(e) => {
                const sizes: ['small', 'default', 'large', 'extra-large'] = ['small', 'default', 'large', 'extra-large'];
                updateSetting('fontSize', sizes[parseInt(e.target.value)] as any);
              }}
              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] font-bold text-gray-300">A</span>
              <span className="text-[20px] font-bold text-gray-300">A</span>
            </div>
          </div>

          <SettingRow
            icon={Globe}
            label="App Language"
            type="select"
            value={settings.language}
            options={[
              { label: 'English', value: 'english' },
              { label: 'Swahili', value: 'swahili' },
            ]}
            onChange={(val) => updateSetting('language', val)}
          />
        </SettingSection>

        {/* Recording */}
        <SettingSection title="Recording">
          <SettingRow
            icon={Volume2}
            label="Audio Quality"
            description={settings.audioQuality === 'low' ? '~28MB/hr' : settings.audioQuality === 'standard' ? '~56MB/hr' : '~112MB/hr'}
            type="select"
            value={settings.audioQuality}
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Standard', value: 'standard' },
              { label: 'High', value: 'high' },
            ]}
            onChange={(val) => updateSetting('audioQuality', val)}
          />
          <SettingRow
            icon={Clock}
            label="Auto-Stop Recording"
            type="toggle"
            value={settings.autoStop}
            onChange={(v) => updateSetting('autoStop', v)}
          />
          <SettingRow
            icon={ShieldCheck}
            label="Consent Reminder"
            description="Required by Kenyan law"
            type="select"
            value={settings.consentReminder}
            options={[
              { label: 'Always', value: 'always' },
              { label: 'First 3 Times', value: '3_times' },
              { label: 'Never', value: 'never' }
            ]}
            onChange={(v) => updateSetting('consentReminder', v)}
          />
        </SettingSection>

        {/* Transcription */}
        <SettingSection title="Transcription">
          <SettingRow
            icon={Cpu}
            label="AI Model"
            type="select"
            value={settings.transcriptionModel}
            options={[
              { label: 'Fast', value: 'fast' },
              { label: 'Balanced', value: 'balanced' },
              { label: 'Accurate', value: 'accurate' }
            ]}
            onChange={(v) => updateSetting('transcriptionModel', v)}
          />
          <SettingRow
            icon={Sparkles}
            label="Auto-Transcribe"
            description="Start after recording stops"
            type="toggle"
            value={settings.autoTranscribe}
            onChange={(v) => updateSetting('autoTranscribe', v)}
          />
          <SettingRow
            icon={User}
            label="Speaker Detection"
            type="toggle"
            value={settings.speakerDetection}
            onChange={(v) => updateSetting('speakerDetection', v)}
          />
        </SettingSection>

        {/* AI & Summarization */}
        <SettingSection title="AI & Summarization">
          <SettingRow
            icon={Monitor}
            label="AI Provider"
            description="Currently only Google Gemini is active"
            type="select"
            value={settings.aiProvider}
            options={[
              { label: 'Google Gemini', value: 'gemini' },
              { label: 'OpenAI GPT (coming soon)', value: 'openai' },
              { label: 'Anthropic Claude (coming soon)', value: 'claude' }
            ]}
            onChange={(v) => updateSetting('aiProvider', v)}
          />
          <SettingRow
            icon={Sparkles}
            label="Summary Type"
            type="select"
            value={settings.summaryType}
            options={[
              { label: 'Executive', value: 'executive' },
              { label: 'Detailed', value: 'detailed' },
              { label: 'Bullet Points', value: 'bullet' },
              { label: 'Study Guide', value: 'study_guide' }
            ]}
            onChange={(v) => updateSetting('summaryType', v)}
          />
          <SettingRow
            icon={Sparkles}
            label="Auto-Summarize"
            description="Summarize after transcription completes"
            type="toggle"
            value={settings.autoSummarize}
            onChange={(v) => updateSetting('autoSummarize', v)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          <SettingRow
            icon={Bell}
            label="Push Notifications"
            type="toggle"
            value={settings.notificationsEnabled}
            onChange={(v) => updateSetting('notificationsEnabled', v)}
          />
          <SettingRow
            icon={Clock}
            label="Study Reminders"
            type="toggle"
            value={settings.studyReminders}
            onChange={handleStudyRemindersToggle}
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title="Privacy & Security">
          <SettingRow
            icon={Shield}
            label="AI Data Usage"
            description="Allow AI providers to use data for training"
            type="toggle"
            value={settings.aiDataUsage}
            onChange={(v) => updateSetting('aiDataUsage', v)}
          />
          <SettingRow
            icon={Globe}
            label="WiFi Only for AI"
            description="Saves mobile data — recommended in Kenya"
            type="toggle"
            value={settings.wifiOnly}
            onChange={(v) => updateSetting('wifiOnly', v)}
          />
          <SettingRow
            icon={Trash2}
            label="Export All My Data"
            onClick={handleExportData}
          />
          <SettingRow
            icon={Trash2}
            label="Delete Account"
            type="danger"
            onClick={handleDeleteAccount}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingRow icon={Info} label="App Version" value="1.0.0" />
          <SettingRow
            icon={MessageSquare}
            label="Join Community (WhatsApp)"
            description="Group link coming soon"
            onClick={() => showInfo('Coming Soon', 'Our WhatsApp study group link will be added here soon.')}
          />
          <SettingRow icon={HelpCircle} label="Built with ❤️ in Kenya 🇰🇪" disabled />
        </SettingSection>

        {/* Footer */}
        <div className="mt-12 text-center pb-12">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            Powered by Gemini & Faster-Whisper
          </p>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          university: profile.university,
          course: profile.course,
          year_of_study: profile.year_of_study
        }}
        onSave={updateProfile}
      />
    </div>
  );
}