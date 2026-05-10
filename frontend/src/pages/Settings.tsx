import React, { useState } from 'react';
import {
  User, Mic, Cpu, Sparkles, Bell, Shield, Info,
  Moon, Sun, Monitor, Type, Globe, Volume2, Clock, Trash2,
  LogOut, Key, ShieldCheck, ChevronRight, HelpCircle,
  MessageSquare, Download, Palette, ChevronLeft,
  Check, Zap, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings, AccentColor } from '../context/SettingsContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../components/settings/EditProfileModal';

// ── Helpers ────────────────────────────────────────────────────────────────

const ACCENT_COLORS: { name: AccentColor; hex: string; label: string }[] = [
  { name: 'blue',   hex: '#007AFF', label: 'Blue'   },
  { name: 'green',  hex: '#34C759', label: 'Green'  },
  { name: 'purple', hex: '#AF52DE', label: 'Purple' },
  { name: 'orange', hex: '#FF9500', label: 'Orange' },
  { name: 'pink',   hex: '#FF2D55', label: 'Pink'   },
  { name: 'teal',   hex: '#5AC8FA', label: 'Teal'   },
  { name: 'red',    hex: '#FF3B30', label: 'Red'    },
  { name: 'yellow', hex: '#FFCC00', label: 'Gold'   },
];

// ── Sub-components ─────────────────────────────────────────────────────────

interface IOSRowProps {
  label: string;
  sublabel?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  noBorder?: boolean;
}

const IOSRow: React.FC<IOSRowProps> = ({
  label, sublabel, left, right, onClick, danger, disabled, noBorder
}) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={[
      'flex items-center gap-3 px-4 py-3 transition-colors select-none',
      onClick && !disabled ? 'active:bg-ios-pressed cursor-pointer' : '',
      disabled ? 'opacity-40' : '',
    ].join(' ')}
  >
    {left && <div className="shrink-0">{left}</div>}
    <div className="flex-1 min-w-0">
      <p className={`text-[17px] leading-snug ${danger ? 'text-ios-red' : 'text-ios-label'}`}>
        {label}
      </p>
      {sublabel && (
        <p className="text-[13px] text-ios-secondary mt-0.5 leading-tight">{sublabel}</p>
      )}
    </div>
    {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
    {onClick && !right && (
      <ChevronRight className="w-4 h-4 text-ios-tertiary shrink-0" />
    )}
    {!noBorder && <div className="absolute left-[60px] right-0 bottom-0 h-[0.5px] bg-ios-separator last:hidden" />}
  </div>
);

interface IOSSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

const IOSSection: React.FC<IOSSectionProps> = ({ title, footer, children }) => (
  <div className="mb-8">
    {title && (
      <p className="px-4 mb-2 text-[13px] font-semibold uppercase tracking-wider text-ios-secondary">
        {title}
      </p>
    )}
    <div className="bg-ios-card rounded-[12px] overflow-hidden divide-y divide-ios-separator relative">
      {children}
    </div>
    {footer && (
      <p className="px-4 mt-2 text-[13px] text-ios-secondary leading-relaxed">{footer}</p>
    )}
  </div>
);

const IOSToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; accent?: string }> = ({
  value, onChange, accent = '#007AFF'
}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(!value); }}
    style={{ backgroundColor: value ? accent : undefined }}
    className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0
      ${value ? '' : 'bg-ios-toggle-off'}`}
  >
    <div className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-ios-toggle
      transition-transform duration-200 ${value ? 'translate-x-[20px]' : 'translate-x-[2px]'}`}
    />
  </button>
);

const IOSIconBox: React.FC<{ bg: string; icon: React.ReactNode }> = ({ bg, icon }) => (
  <div className={`w-[29px] h-[29px] rounded-[6px] flex items-center justify-center shrink-0 ${bg}`}>
    <div className="text-white w-4 h-4">{icon}</div>
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────

type Section = 'root' | 'appearance' | 'recording' | 'transcription' | 'ai' | 'notifications' | 'privacy';

export function Settings() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings, profile, updateSetting, updateProfile, loading: settingsLoading } = useSettings();
  const { showModal, showSuccess, showError, showInfo } = useNotification();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [section, setSection] = useState<Section>('root');

  const accent = ACCENT_COLORS.find(c => c.name === settings.accentColor)?.hex ?? '#007AFF';

  if (settingsLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ios-separator border-t-ios-blue rounded-full animate-spin" />
          <p className="text-[13px] text-ios-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = () => showModal({
    title: 'Log out of StudyPro?',
    body: 'You will need to log in again to access your lectures.',
    confirmText: 'Log Out',
    onConfirm: signOut,
  });

  const handleDeleteAccount = () => showModal({
    title: 'Delete your account?',
    body: 'All your lectures, transcripts and summaries will be permanently deleted after 21 days. Log back in within 21 days to cancel.',
    confirmText: 'Schedule Deletion',
    confirmStyle: 'destructive',
    onConfirm: async () => {
      try {
        const { supabase: sb } = await import('../lib/supabase');
        await sb.from('profiles').update({ deletion_scheduled_at: new Date().toISOString() } as any).eq('id', user?.id ?? '');
        localStorage.clear();
        await signOut();
        showSuccess('Deletion Scheduled', 'Your account will be deleted in 21 days.');
      } catch { showError('Failed', 'Could not schedule deletion. Email support@studypro.app.'); }
    },
  });

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { supabase: sb } = await import('../lib/supabase');
      const { error } = await sb.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showSuccess('Link Sent', 'Check your inbox for a password reset link.');
    } catch { showError('Failed', 'Could not send password reset email.'); }
  };

  const handleStudyRemindersToggle = async (enabled: boolean) => {
    if (!enabled) { updateSetting('studyReminders', false); return; }
    if (!('Notification' in window)) { showInfo('Not Supported', 'Notifications are not supported in your browser.'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      updateSetting('studyReminders', true);
      showSuccess('Reminders On', 'You will receive study reminders.');
    } else {
      showError('Permission Denied', 'Allow notifications in browser settings first.');
    }
  };

  const handleExportData = async () => {
    showInfo('Export Started', 'Compiling your data…');
    try {
      const { apiClient } = await import('../services/api');
      const res = await apiClient.getLectures();
      if (!res.success) throw new Error();
      const full = await Promise.all((res.lectures || []).map((l: any) => apiClient.getLecture(l.id).then((r: any) => r.lecture)));
      const blob = new Blob([JSON.stringify({ profile, settings, lectures: full }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `studypro_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Export Complete', 'Your archive has been downloaded.');
    } catch { showError('Export Failed', 'Could not compile your data.'); }
  };

  // ── Section screens ───────────────────────────────────────────────────────

  const SubHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center gap-2 px-4 pt-12 pb-6">
      <button onClick={() => setSection('root')} className="flex items-center gap-1 text-ios-blue active:opacity-60">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[17px]">Settings</span>
      </button>
      <div className="flex-1" />
      <h1 className="text-[17px] font-semibold text-ios-label absolute left-1/2 -translate-x-1/2">{title}</h1>
    </div>
  );

  if (section === 'appearance') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="Appearance" />
      <div className="px-4">
        <IOSSection title="Theme">
          {(['light', 'dark', 'system'] as const).map(t => (
            <IOSRow
              key={t}
              label={t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System Default'}
              left={<IOSIconBox bg={t === 'light' ? 'bg-yellow-400' : t === 'dark' ? 'bg-gray-800' : 'bg-gray-500'}
                icon={t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />} />}
              right={settings.theme === t ? <Check className="w-5 h-5" style={{ color: accent }} /> : undefined}
              onClick={() => updateSetting('theme', t)}
            />
          ))}
        </IOSSection>

        <IOSSection title="Accent Colour">
          <div className="px-4 py-4 grid grid-cols-4 gap-4">
            {ACCENT_COLORS.map(c => (
              <button key={c.name} onClick={() => updateSetting('accentColor', c.name)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div style={{ backgroundColor: c.hex }}
                  className="w-12 h-12 rounded-full flex items-center justify-center">
                  {settings.accentColor === c.name && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-[12px] text-ios-secondary">{c.label}</span>
              </button>
            ))}
          </div>
        </IOSSection>

        <IOSSection title="Text Size">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] text-ios-secondary">A</span>
              <input type="range" min="0" max="3" step="1"
                value={['small','default','large','extra-large'].indexOf(settings.fontSize)}
                onChange={(e) => {
                  const s = ['small','default','large','extra-large'] as const;
                  updateSetting('fontSize', s[+e.target.value]);
                }}
                style={{ accentColor: accent }}
                className="flex-1 h-1 rounded-full" />
              <span className="text-[20px] text-ios-secondary">A</span>
            </div>
            <p className="text-[13px] text-ios-secondary text-center capitalize">{settings.fontSize}</p>
          </div>
        </IOSSection>

        <IOSSection title="Language">
          {([['english','English'],['swahili','Kiswahili']] as const).map(([v, l]) => (
            <IOSRow key={v} label={l}
              right={settings.language === v ? <Check className="w-5 h-5" style={{ color: accent }} /> : undefined}
              onClick={() => updateSetting('language', v)} />
          ))}
        </IOSSection>
      </div>
    </div>
  );

  if (section === 'recording') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="Recording" />
      <div className="px-4">
        <IOSSection title="Quality" footer="Higher quality uses more storage. Standard is recommended for most lectures.">
          {([['low','Low','~28 MB/hr'],['standard','Standard','~56 MB/hr'],['high','High','~112 MB/hr']] as const).map(([v,l,sub]) => (
            <IOSRow key={v} label={l} sublabel={sub}
              right={settings.audioQuality === v ? <Check className="w-5 h-5" style={{ color: accent }} /> : undefined}
              onClick={() => updateSetting('audioQuality', v)} />
          ))}
        </IOSSection>
        <IOSSection>
          <IOSRow label="Auto-Stop Recording" sublabel="Stop after silence detected"
            left={<IOSIconBox bg="bg-orange-500" icon={<Clock className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.autoStop} onChange={v => updateSetting('autoStop', v)} accent={accent} />} />
          <IOSRow label="Consent Reminder" sublabel="Required by Kenyan law"
            left={<IOSIconBox bg="bg-green-600" icon={<ShieldCheck className="w-4 h-4" />} />}
            right={
              <select value={settings.consentReminder} onClick={e => e.stopPropagation()}
                onChange={e => updateSetting('consentReminder', e.target.value as any)}
                className="text-[15px] text-ios-secondary bg-transparent border-none focus:ring-0 appearance-none pr-4">
                <option value="always">Always</option>
                <option value="3_times">First 3 times</option>
                <option value="never">Never</option>
              </select>
            } />
        </IOSSection>
      </div>
    </div>
  );

  if (section === 'transcription') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="Transcription" />
      <div className="px-4">
        <IOSSection title="AI Model" footer="Fast uses Groq cloud (seconds). Accurate uses local Whisper (slower, private).">
          {([['fast','Fast','Groq Whisper — cloud, ~2s'],['balanced','Balanced','Groq → local fallback'],['accurate','Accurate','Local Whisper — private, slower']] as const).map(([v,l,sub]) => (
            <IOSRow key={v} label={l} sublabel={sub}
              right={settings.transcriptionModel === v ? <Check className="w-5 h-5" style={{ color: accent }} /> : undefined}
              onClick={() => updateSetting('transcriptionModel', v)} />
          ))}
        </IOSSection>
        <IOSSection>
          <IOSRow label="Auto-Transcribe" sublabel="Start after recording stops"
            left={<IOSIconBox bg="bg-blue-500" icon={<Zap className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.autoTranscribe} onChange={v => updateSetting('autoTranscribe', v)} accent={accent} />} />
          <IOSRow label="Speaker Detection" sublabel="Identify multiple speakers"
            left={<IOSIconBox bg="bg-purple-500" icon={<User className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.speakerDetection} onChange={v => updateSetting('speakerDetection', v)} accent={accent} />} />
        </IOSSection>
      </div>
    </div>
  );

  if (section === 'ai') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="AI & Summarisation" />
      <div className="px-4">
        <IOSSection title="Summary Style">
          {([['executive','Executive','Key points & decisions'],['detailed','Detailed','Full structured notes'],['bullet','Bullet Points','Quick scan format'],['study_guide','Study Guide','Exam-ready format']] as const).map(([v,l,sub]) => (
            <IOSRow key={v} label={l} sublabel={sub}
              right={settings.summaryType === v ? <Check className="w-5 h-5" style={{ color: accent }} /> : undefined}
              onClick={() => updateSetting('summaryType', v)} />
          ))}
        </IOSSection>
        <IOSSection>
          <IOSRow label="Auto-Summarise" sublabel="Run after transcription completes"
            left={<IOSIconBox bg="bg-pink-500" icon={<Sparkles className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.autoSummarize} onChange={v => updateSetting('autoSummarize', v)} accent={accent} />} />
        </IOSSection>
        <IOSSection title="Provider" footer="OpenAI and Claude support coming soon.">
          <IOSRow label="Google Gemini" sublabel="Currently active"
            right={<Check className="w-5 h-5" style={{ color: accent }} />} />
          <IOSRow label="OpenAI GPT" disabled right={<span className="text-[13px] text-ios-tertiary">Soon</span>} />
          <IOSRow label="Anthropic Claude" disabled right={<span className="text-[13px] text-ios-tertiary">Soon</span>} />
        </IOSSection>
      </div>
    </div>
  );

  if (section === 'notifications') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="Notifications" />
      <div className="px-4">
        <IOSSection>
          <IOSRow label="Allow Notifications"
            left={<IOSIconBox bg="bg-red-500" icon={<Bell className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.notificationsEnabled} onChange={v => updateSetting('notificationsEnabled', v)} accent={accent} />} />
          <IOSRow label="Study Reminders" sublabel="Daily push notification"
            left={<IOSIconBox bg="bg-orange-500" icon={<Clock className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.studyReminders} onChange={handleStudyRemindersToggle} accent={accent} />} />
        </IOSSection>
      </div>
    </div>
  );

  if (section === 'privacy') return (
    <div className="min-h-screen bg-ios-bg pb-20">
      <SubHeader title="Privacy & Security" />
      <div className="px-4">
        <IOSSection footer="When on, AI providers may use your anonymised transcripts to improve their models.">
          <IOSRow label="AI Training Data" sublabel="Allow data use for model training"
            left={<IOSIconBox bg="bg-gray-600" icon={<Database className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.aiDataUsage} onChange={v => updateSetting('aiDataUsage', v)} accent={accent} />} />
          <IOSRow label="Wi-Fi Only for AI" sublabel="Saves mobile data — recommended"
            left={<IOSIconBox bg="bg-blue-500" icon={<Globe className="w-4 h-4" />} />}
            right={<IOSToggle value={settings.wifiOnly} onChange={v => updateSetting('wifiOnly', v)} accent={accent} />} />
        </IOSSection>
        <IOSSection>
          <IOSRow label="Export All My Data"
            left={<IOSIconBox bg="bg-green-600" icon={<Download className="w-4 h-4" />} />}
            onClick={handleExportData} />
        </IOSSection>
        <IOSSection>
          <IOSRow label="Delete Account" danger onClick={handleDeleteAccount} />
        </IOSSection>
      </div>
    </div>
  );

  // ── Root ──────────────────────────────────────────────────────────────────

  const initials = (profile.full_name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-ios-bg pb-24 text-ios-label">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-14 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ios-blue active:opacity-60">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[17px]">Back</span>
          </button>
          <h1 className="text-[34px] font-bold tracking-tight text-ios-label absolute left-4 top-20">Settings</h1>
        </div>
        <div className="mt-8" />

        {/* Profile Card */}
        <div
          onClick={() => setIsEditProfileOpen(true)}
          className="bg-ios-card rounded-[12px] overflow-hidden mb-8 flex items-center gap-4 px-4 py-3 active:bg-ios-pressed cursor-pointer"
        >
          <div style={{ backgroundColor: accent }}
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              : <span className="text-white text-[22px] font-semibold">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-semibold text-ios-label leading-tight truncate">
              {profile.full_name || 'Set up your profile'}
            </p>
            <p className="text-[15px] text-ios-secondary truncate">{user?.email}</p>
            {profile.university && (
              <p className="text-[13px] text-ios-tertiary truncate mt-0.5">{profile.university}{profile.year_of_study ? ` · ${profile.year_of_study}` : ''}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-ios-tertiary shrink-0" />
        </div>

        {/* Account */}
        <IOSSection title="Account">
          <IOSRow label="Change Password"
            left={<IOSIconBox bg="bg-gray-500" icon={<Key className="w-4 h-4" />} />}
            onClick={handleChangePassword} />
          <IOSRow label="Email Verification"
            left={<IOSIconBox bg="bg-green-500" icon={<ShieldCheck className="w-4 h-4" />} />}
            right={<span className="text-[15px] text-ios-secondary">Verified</span>} />
          <IOSRow label="Sign Out" danger
            left={<IOSIconBox bg="bg-red-500" icon={<LogOut className="w-4 h-4" />} />}
            onClick={handleSignOut} />
        </IOSSection>

        {/* Preferences */}
        <IOSSection title="Preferences">
          <IOSRow label="Appearance"
            left={<IOSIconBox bg="bg-indigo-500" icon={<Palette className="w-4 h-4" />} />}
            sublabel={`${settings.theme === 'system' ? 'System' : settings.theme === 'dark' ? 'Dark' : 'Light'} · ${ACCENT_COLORS.find(c => c.name === settings.accentColor)?.label}`}
            onClick={() => setSection('appearance')} />
          <IOSRow label="Recording"
            left={<IOSIconBox bg="bg-red-500" icon={<Mic className="w-4 h-4" />} />}
            sublabel={`${settings.audioQuality.charAt(0).toUpperCase() + settings.audioQuality.slice(1)} quality`}
            onClick={() => setSection('recording')} />
          <IOSRow label="Transcription"
            left={<IOSIconBox bg="bg-blue-500" icon={<Cpu className="w-4 h-4" />} />}
            sublabel={`${settings.transcriptionModel.charAt(0).toUpperCase() + settings.transcriptionModel.slice(1)} model${settings.autoTranscribe ? ' · Auto' : ''}`}
            onClick={() => setSection('transcription')} />
          <IOSRow label="AI & Summarisation"
            left={<IOSIconBox bg="bg-pink-500" icon={<Sparkles className="w-4 h-4" />} />}
            sublabel={`${settings.summaryType.replace('_',' ')} style${settings.autoSummarize ? ' · Auto' : ''}`}
            onClick={() => setSection('ai')} />
          <IOSRow label="Notifications"
            left={<IOSIconBox bg="bg-red-400" icon={<Bell className="w-4 h-4" />} />}
            sublabel={settings.notificationsEnabled ? 'On' : 'Off'}
            onClick={() => setSection('notifications')} />
          <IOSRow label="Privacy & Security"
            left={<IOSIconBox bg="bg-gray-600" icon={<Shield className="w-4 h-4" />} />}
            onClick={() => setSection('privacy')} />
        </IOSSection>

        {/* About */}
        <IOSSection title="About">
          <IOSRow label="App Version"
            left={<IOSIconBox bg="bg-blue-600" icon={<Info className="w-4 h-4" />} />}
            right={<span className="text-[15px] text-ios-secondary">1.0.0</span>} />
          <IOSRow label="WhatsApp Community"
            left={<IOSIconBox bg="bg-green-500" icon={<MessageSquare className="w-4 h-4" />} />}
            sublabel="Group link coming soon"
            onClick={() => showInfo('Coming Soon', 'WhatsApp study group link will be added here soon.')} />
          <IOSRow label="Built with ❤️ in Kenya 🇰🇪"
            left={<IOSIconBox bg="bg-red-600" icon={<HelpCircle className="w-4 h-4" />} />}
            disabled />
        </IOSSection>

      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          university: profile.university,
          course: profile.course,
          year_of_study: profile.year_of_study,
        }}
        onSave={updateProfile}
      />
    </div>
  );
}