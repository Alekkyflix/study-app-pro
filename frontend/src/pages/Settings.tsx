import React, { useState } from 'react';
import {
  User, Palette, Mic, Cpu, Sparkles, Bell, Shield, Info,
  Moon, Sun, Monitor, Type, Globe, Volume2, Clock, Trash2,
  LogOut, Key, ShieldCheck, ChevronRight, HelpCircle, MessageSquare, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings, AccentColor } from '../context/SettingsContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileCard from '../components/settings/ProfileCard';
import SettingSection from '../components/settings/SettingSection';
import SettingRow from '../components/settings/SettingRow';
import EditProfileModal from '../components/settings/EditProfileModal';
import { useTranslation } from '../lib/i18n';

const ACCENT_COLORS: { name: AccentColor; hex: string }[] = [
  { name: 'blue',   hex: '#3b82f6' },
  { name: 'green',  hex: '#10b981' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
  { name: 'pink',   hex: '#ec4899' },
  { name: 'teal',   hex: '#14b8a6' },
  { name: 'red',    hex: '#ef4444' },
  { name: 'yellow', hex: '#eab308' },
];

export function Settings() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings, profile, updateSetting, updateProfile, loading: settingsLoading } = useSettings();
  const { showModal, showSuccess, showError, showInfo } = useNotification();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const { t } = useTranslation(settings?.language);

  // NOTE: Theme is already applied by SettingsContext, no need to duplicate here

  if (settingsLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Settings</p>
        </div>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    showModal({
      title: 'Log out of StudyPro?',
      body: 'You will need to log in again to access your lectures.',
      confirmText: 'Log Out',
      onConfirm: signOut,
    });
  };

  const handleDeleteAccount = () => {
    showModal({
      title: 'Delete your account?',
      body: 'Your account and all data (lectures, transcripts, summaries) will be scheduled for permanent deletion. You have 21 days to cancel by logging back in and contacting support. After 21 days, deletion is irreversible.',
      confirmText: 'Schedule Deletion',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        try {
          const { supabase: sb } = await import('../lib/supabase');
          await sb.from('profiles').update({
            deletion_scheduled_at: new Date().toISOString(),
          } as any).eq('id', user?.id ?? '');
          localStorage.clear();
          await signOut();
          showSuccess('Deletion Scheduled', 'Your account is queued for deletion in 21 days. Log in within 21 days to cancel.');
        } catch {
          showError('Failed', 'Could not schedule deletion. Please email support@studypro.app.');
        }
      },
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
      showSuccess('Link Sent', 'Check your inbox for a password reset link.');
    } catch {
      showError('Failed', 'Could not send password reset email.');
    }
  };

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
      showError('Permission Denied', 'Please allow notifications in your browser settings to enable study reminders.');
    }
  };

  const handleExportData = async () => {
    showInfo('Export Started', 'Compiling your data archive...');
    try {
      const { apiClient } = await import('../services/api');
      const res = await apiClient.getLectures();
      if (!res.success) throw new Error('Could not fetch lectures');
      const fullData = await Promise.all(
        (res.lectures || []).map(async (l: any) => {
          const detail = await apiClient.getLecture(l.id);
          return detail.lecture;
        })
      );
      const blob = new Blob([JSON.stringify({ profile, settings, lectures: fullData }, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
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

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 pb-24 md:pb-12 text-gray-900 dark:text-white tracking-tight transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white rotate-180" />
          </button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-gray-900 dark:text-white">{t('settings')}</h1>
            <p className="text-gray-500 font-medium italic">{t('subtitle')}</p>
          </div>
        </div>

        {/* Profile Card */}
        <ProfileCard
          name={profile.full_name}
          email={user?.email || ''}
          university={profile.university}
          yearOfStudy={profile.year_of_study}
          joinedDate={profile.joined_at}
          avatarUrl={profile.avatar_url}
          onEdit={() => setIsEditProfileOpen(true)}
        />

        {/* Account */}
        <SettingSection title={t('account')}>
          <SettingRow icon={Key} label={t('changePassword')} onClick={handleChangePassword} />
          <SettingRow icon={ShieldCheck} label={t('emailVerification')} value="Verified" disabled />
          <SettingRow icon={LogOut} label={t('signOut')} type="danger" onClick={handleSignOut} />
        </SettingSection>

        {/* Appearance */}
        <SettingSection title={t('appearance')}>
          <div className="p-4 bg-gray-50/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('accentColor')}</p>
            <div className="flex items-center justify-between px-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateSetting('accentColor', color.name)}
                  className={`w-8 h-8 rounded-full transition-all transform hover:scale-110 active:scale-90
                    ${settings.accentColor === color.name ? 'ring-4 ring-offset-2 ring-gray-900 dark:ring-white scale-110' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {/* Theme */}
          <SettingRow
            icon={settings.theme === 'dark' ? Moon : settings.theme === 'light' ? Sun : Monitor}
            label={t('theme')}
            type="select"
            value={settings.theme}
            options={[
              { label: t('light'), value: 'light' },
              { label: t('dark'),  value: 'dark'  },
              { label: t('system'), value: 'system' },
            ]}
            onChange={(val) => updateSetting('theme', val)}
          />

          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white flex-1">{t('fontSize')}</p>
              <span className="text-xs font-black uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-500 dark:text-gray-400">
                {settings.fontSize}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-1 rounded-2xl flex relative h-12">
              <motion.div 
                className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600"
                initial={false}
                animate={{
                  left: `${['small', 'default', 'large', 'extra-large'].indexOf(settings.fontSize) * 25}%`,
                  width: '25%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
              {(['small', 'default', 'large', 'extra-large'] as const).map((size, index) => (
                <button
                  key={size}
                  onClick={() => updateSetting('fontSize', size)}
                  className={`flex-1 relative z-10 font-bold transition-colors text-sm flex items-center justify-center ${
                    settings.fontSize === size ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {/* Visual size indicator */}
                  <span style={{ fontSize: `${0.8 + index * 0.15}rem` }}>A</span>
                </button>
              ))}
            </div>
          </div>

          <SettingRow
            icon={Globe}
            label={t('appLanguage')}
            type="select"
            value={settings.language}
            options={[
              { label: 'English',   value: 'english' },
              { label: 'Kiswahili', value: 'swahili' },
              { label: 'Français',  value: 'french' },
              { label: 'Español',   value: 'spanish' },
              { label: 'Deutsch',   value: 'german' },
            ]}
            onChange={(val) => updateSetting('language', val)}
          />
        </SettingSection>

        {/* Recording */}
        <SettingSection title={t('recording')}>
          <SettingRow
            icon={Volume2}
            label={t('audioQuality')}
            description={
              settings.audioQuality === 'low' ? '~28 MB/hr'
              : settings.audioQuality === 'standard' ? '~56 MB/hr'
              : '~112 MB/hr'
            }
            type="select"
            value={settings.audioQuality}
            options={[
              { label: t('low'),      value: 'low'      },
              { label: t('standard'), value: 'standard' },
              { label: t('high'),     value: 'high'     },
            ]}
            onChange={(val) => updateSetting('audioQuality', val)}
          />
          <SettingRow
            icon={Clock}
            label={t('autoStopRecording')}
            type="toggle"
            value={settings.autoStop}
            onChange={(v) => updateSetting('autoStop', v)}
          />
          <SettingRow
            icon={ShieldCheck}
            label={t('consentReminder')}
            type="select"
            value={settings.consentReminder}
            options={[
              { label: t('always'),       value: 'always'  },
              { label: t('first3Times'), value: '3_times' },
              { label: t('never'),        value: 'never'   },
            ]}
            onChange={(v) => updateSetting('consentReminder', v)}
          />
        </SettingSection>

        {/* Transcription */}
        <SettingSection title={t('transcription')}>
          <SettingRow
            icon={Cpu}
            label={t('aiModel')}
            description={
              settings.transcriptionModel === 'fast' ? 'Groq cloud · ~2s'
              : settings.transcriptionModel === 'balanced' ? 'Groq → local fallback'
              : 'Local Whisper · private'
            }
            type="select"
            value={settings.transcriptionModel}
            options={[
              { label: t('fast'),     value: 'fast'     },
              { label: t('balanced'), value: 'balanced' },
              { label: t('accurate'), value: 'accurate' },
            ]}
            onChange={(v) => updateSetting('transcriptionModel', v)}
          />
          <SettingRow
            icon={Sparkles}
            label={t('autoTranscribe')}
            type="toggle"
            value={settings.autoTranscribe}
            onChange={(v) => updateSetting('autoTranscribe', v)}
          />
          <SettingRow
            icon={User}
            label={t('speakerDetection')}
            type="toggle"
            value={settings.speakerDetection}
            onChange={(v) => updateSetting('speakerDetection', v)}
          />
        </SettingSection>

        {/* AI & Summarization */}
        <SettingSection title={t('aiSummarization')}>
          <SettingRow
            icon={Monitor}
            label={t('aiProvider')}
            type="select"
            value={settings.aiProvider}
            options={[
              { label: 'Google Gemini',              value: 'gemini' },
              { label: 'OpenAI GPT (coming soon)',   value: 'openai' },
              { label: 'Anthropic Claude (coming soon)', value: 'claude' },
            ]}
            onChange={(v) => updateSetting('aiProvider', v)}
          />
          <SettingRow
            icon={Sparkles}
            label={t('summaryType')}
            type="select"
            value={settings.summaryType}
            options={[
              { label: t('executive'),    value: 'executive'   },
              { label: t('detailed'),     value: 'detailed'    },
              { label: t('bulletPoints'), value: 'bullet'     },
              { label: t('studyGuide'),  value: 'study_guide' },
            ]}
            onChange={(v) => updateSetting('summaryType', v)}
          />
          <SettingRow
            icon={Sparkles}
            label={t('autoSummarize')}
            type="toggle"
            value={settings.autoSummarize}
            onChange={(v) => updateSetting('autoSummarize', v)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title={t('notifications')}>
          <SettingRow
            icon={Bell}
            label={t('pushNotifications')}
            type="toggle"
            value={settings.notificationsEnabled}
            onChange={(v) => updateSetting('notificationsEnabled', v)}
          />
          <SettingRow
            icon={Clock}
            label={t('studyReminders')}
            type="toggle"
            value={settings.studyReminders}
            onChange={handleStudyRemindersToggle}
          />
        </SettingSection>

        {/* Privacy & Security */}
        <SettingSection title={t('privacySecurity')}>
          <SettingRow
            icon={Shield}
            label={t('aiDataUsage')}
            type="toggle"
            value={settings.aiDataUsage}
            onChange={(v) => updateSetting('aiDataUsage', v)}
          />
          <SettingRow
            icon={Globe}
            label={t('wifiOnly')}
            type="toggle"
            value={settings.wifiOnly}
            onChange={(v) => updateSetting('wifiOnly', v)}
          />
          <SettingRow
            icon={Download}
            label={t('exportData')}
            onClick={handleExportData}
          />
          <SettingRow
            icon={Trash2}
            label={t('deleteAccount')}
            type="danger"
            onClick={handleDeleteAccount}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title={t('about')}>
          <SettingRow icon={Info} label={t('appVersion')} value="1.0.0" />
          <SettingRow
            icon={MessageSquare}
            label={t('joinCommunity')}
            onClick={() => showInfo('Coming Soon', 'Our WhatsApp study group link will be added here soon.')}
          />
          <SettingRow icon={HelpCircle} label={t('builtWithLove')} disabled />
        </SettingSection>

        {/* Footer */}
        <div className="mt-12 text-center pb-12">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            {t('poweredBy')}
          </p>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          full_name:    profile.full_name,
          phone_number: profile.phone_number,
          university:   profile.university,
          course:       profile.course,
          year_of_study: profile.year_of_study,
        }}
        onSave={updateProfile}
      />
    </div>
  );
}