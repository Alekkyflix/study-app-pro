import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Mic, Cpu, Sparkles, Bell, Shield, Info,
  Moon, Sun, Monitor, Type, Globe, Volume2, Clock, Trash2,
  LogOut, Key, ShieldCheck, ChevronRight, HelpCircle,
  MessageSquare, Download, Palette, ChevronLeft,
  Check, Zap, Database, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings, AccentColor } from '../context/SettingsContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../components/settings/EditProfileModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = 'root' | 'appearance' | 'recording' | 'transcription' | 'ai' | 'notifications' | 'privacy';

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENTS: { name: AccentColor; hex: string; label: string }[] = [
  { name: 'blue',   hex: '#007AFF', label: 'Blue'   },
  { name: 'green',  hex: '#34C759', label: 'Green'  },
  { name: 'purple', hex: '#AF52DE', label: 'Purple' },
  { name: 'orange', hex: '#FF9500', label: 'Orange' },
  { name: 'pink',   hex: '#FF2D55', label: 'Pink'   },
  { name: 'teal',   hex: '#5AC8FA', label: 'Teal'   },
  { name: 'red',    hex: '#FF3B30', label: 'Red'    },
  { name: 'yellow', hex: '#FFCC00', label: 'Gold'   },
];

// ─── Primitives ───────────────────────────────────────────────────────────────

const IconBox: React.FC<{ bg: string; icon: React.ReactNode }> = ({ bg, icon }) => (
  <div className="s-icon-box shrink-0" style={{ background: bg }}>
    <div style={{ color: '#fff', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  </div>
);

const Toggle: React.FC<{ on: boolean; accent: string; onChange: (v: boolean) => void }> = ({ on, accent, onChange }) => (
  <button
    className={`s-toggle-track ${on ? 'on' : ''}`}
    style={on ? { background: accent } : {}}
    onClick={e => { e.stopPropagation(); onChange(!on); }}
  >
    <div className="s-toggle-thumb" />
  </button>
);

interface RowProps {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  delay?: number;
}

const Row: React.FC<RowProps> = ({ icon, label, sub, right, danger, disabled, onClick, delay = 0 }) => (
  <div
    className="s-row animate-fade-up"
    style={{ animationDelay: `${delay}s`, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
    onClick={disabled ? undefined : onClick}
  >
    {icon && <div className="shrink-0">{icon}</div>}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p className="s-label" style={danger ? { color: '#FF3B30' } : {}}>{label}</p>
      {sub && <p className="s-sub">{sub}</p>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {right}
      {onClick && !right && <ChevronRight size={16} style={{ color: 'var(--s-dim)' }} />}
      {danger && onClick && <ChevronRight size={16} style={{ color: '#FF3B30', opacity: 0.4 }} />}
    </div>
  </div>
);

interface SectionBlockProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  delay?: number;
}

const SectionBlock: React.FC<SectionBlockProps> = ({ title, footer, children, delay = 0 }) => (
  <div className="animate-fade-up" style={{ marginBottom: 32, animationDelay: `${delay}s` }}>
    {title && <p className="s-title">{title}</p>}
    <div className="s-card">{children}</div>
    {footer && <p className="s-footer">{footer}</p>}
  </div>
);

const SubPageHeader: React.FC<{ title: string; onBack: () => void; accent: string }> = ({ title, onBack, accent }) => (
  <div style={{ paddingTop: 56, paddingBottom: 8, paddingLeft: 16, paddingRight: 16,
    position: 'relative', display: 'flex', alignItems: 'center' }}>
    <button onClick={onBack}
      style={{ display: 'flex', alignItems: 'center', gap: 4, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: 17 }}>
      <ChevronLeft size={20} /> Settings
    </button>
    <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)',
      fontSize: 17, fontWeight: 600, color: 'var(--s-label)' }}>{title}</p>
  </div>
);

const Checkmark: React.FC<{ accent: string }> = ({ accent }) => (
  <Check size={20} style={{ color: accent }} strokeWidth={2.5} />
);

// ─── Sub-pages ────────────────────────────────────────────────────────────────

const AppearancePage: React.FC<{ settings: any; updateSetting: any; accent: string; onBack: () => void }> =
  ({ settings, updateSetting, accent, onBack }) => (
  <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
    <SubPageHeader title="Appearance" onBack={onBack} accent={accent} />
    <div style={{ padding: '16px 16px 0' }}>

      <SectionBlock title="Theme" delay={0.05}>
        {[
          { v: 'light',  label: 'Light',          sub: 'Always light',        bg: '#FF9500', icon: <Sun size={16}/> },
          { v: 'dark',   label: 'Dark',            sub: 'Always dark',         bg: '#1C1C1E', icon: <Moon size={16}/> },
          { v: 'system', label: 'System Default',  sub: 'Follows device theme', bg: '#636366', icon: <Monitor size={16}/> },
        ].map(({ v, label, sub, bg, icon }, i) => (
          <Row key={v} delay={0.05 + i * 0.04}
            icon={<IconBox bg={bg} icon={icon} />}
            label={label} sub={sub}
            right={settings.theme === v ? <Checkmark accent={accent} /> : undefined}
            onClick={() => updateSetting('theme', v)} />
        ))}
      </SectionBlock>

      <SectionBlock title="Accent Colour" delay={0.15}>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {ACCENTS.map((c, i) => (
            <button key={c.name} onClick={() => updateSetting('accentColor', c.name)}
              className="animate-fade-up"
              style={{ animationDelay: `${0.15 + i * 0.03}s`, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
                transition: 'transform 0.15s', padding: 4 }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.hex,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: settings.accentColor === c.name ? `0 0 0 3px var(--s-card), 0 0 0 5px ${c.hex}` : 'none',
                transition: 'box-shadow 0.2s' }}>
                {settings.accentColor === c.name && <Check size={20} color="white" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12, color: 'var(--s-sub)' }}>{c.label}</span>
            </button>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Text Size" delay={0.25}>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--s-sub)' }}>A</span>
            <input type="range" min={0} max={3} step={1}
              value={['small','default','large','extra-large'].indexOf(settings.fontSize)}
              onChange={e => {
                const s = ['small','default','large','extra-large'] as const;
                updateSetting('fontSize', s[+e.target.value]);
              }}
              style={{ flex: 1, accentColor: accent }} />
            <span style={{ fontSize: 22, color: 'var(--s-sub)' }}>A</span>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--s-sub)', textTransform: 'capitalize' }}>
            {settings.fontSize}
          </p>
        </div>
      </SectionBlock>

      <SectionBlock title="Language" delay={0.3}>
        {[['english','English',''],['swahili','Kiswahili','']].map(([v,l], i) => (
          <Row key={v} delay={0.3 + i * 0.04} label={l}
            right={settings.language === v ? <Checkmark accent={accent} /> : undefined}
            onClick={() => updateSetting('language', v)} />
        ))}
      </SectionBlock>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Settings() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { settings, profile, updateSetting, updateProfile, loading: settingsLoading } = useSettings();
  const { showModal, showSuccess, showError, showInfo } = useNotification();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [section, setSection] = useState<Section>('root');
  const [prevSection, setPrevSection] = useState<Section>('root');

  const accent = ACCENTS.find(c => c.name === settings.accentColor)?.hex ?? '#007AFF';

  const goTo = (s: Section) => { setPrevSection(section); setSection(s); };
  const goBack = () => { setPrevSection(section); setSection('root'); };

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const effective = settings.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : settings.theme;
    effective === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  }, [settings.theme]);

  if (settingsLoading || !profile) return (
    <div className="settings-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader size={24} style={{ color: accent, animation: 'spin 1s linear infinite' }} />
    </div>
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSignOut = () => showModal({
    title: 'Log out of StudyPro?',
    body: 'You will need to log in again to access your lectures.',
    confirmText: 'Log Out', onConfirm: signOut,
  });

  const handleDeleteAccount = () => showModal({
    title: 'Delete your account?',
    body: 'All lectures, transcripts and summaries will be permanently deleted after 21 days.',
    confirmText: 'Schedule Deletion', confirmStyle: 'destructive',
    onConfirm: async () => {
      try {
        const { supabase: sb } = await import('../lib/supabase');
        await sb.from('profiles').update({ deletion_scheduled_at: new Date().toISOString() } as any).eq('id', user?.id ?? '');
        localStorage.clear(); await signOut();
        showSuccess('Deletion Scheduled', 'Account will be deleted in 21 days.');
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
    } catch { showError('Failed', 'Could not send reset email.'); }
  };

  const handleStudyReminders = async (enabled: boolean) => {
    if (!enabled) { updateSetting('studyReminders', false); return; }
    if (!('Notification' in window)) { showInfo('Not Supported', 'Notifications not supported in your browser.'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { updateSetting('studyReminders', true); showSuccess('Reminders On', 'You will receive study reminders.'); }
    else showError('Permission Denied', 'Allow notifications in browser settings first.');
  };

  const handleExport = async () => {
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

  // ── Sub-pages ──────────────────────────────────────────────────────────────

  if (section === 'appearance') return (
    <AppearancePage settings={settings} updateSetting={updateSetting} accent={accent} onBack={goBack} />
  );

  if (section === 'recording') return (
    <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
      <SubPageHeader title="Recording" onBack={goBack} accent={accent} />
      <div style={{ padding: '16px 16px 0' }}>
        <SectionBlock title="Audio Quality" footer="Higher quality uses more storage. Standard is recommended." delay={0.05}>
          {[['low','Low','~28 MB / hr'],['standard','Standard','~56 MB / hr'],['high','High','~112 MB / hr']].map(([v,l,sub],i) => (
            <Row key={v} delay={0.05+i*0.04} label={l} sub={sub}
              right={settings.audioQuality === v ? <Checkmark accent={accent}/> : undefined}
              onClick={() => updateSetting('audioQuality', v as any)} />
          ))}
        </SectionBlock>
        <SectionBlock delay={0.2}>
          <Row delay={0.2} icon={<IconBox bg="#FF9500" icon={<Clock size={16}/>}/>}
            label="Auto-Stop Recording" sub="Stop after silence detected"
            right={<Toggle on={settings.autoStop} accent={accent} onChange={v => updateSetting('autoStop', v)}/>} />
          <Row delay={0.24} icon={<IconBox bg="#34C759" icon={<ShieldCheck size={16}/>}/>}
            label="Consent Reminder" sub="Required by Kenyan law"
            right={
              <select value={settings.consentReminder} onClick={e => e.stopPropagation()}
                onChange={e => updateSetting('consentReminder', e.target.value as any)}
                style={{ fontSize:15, color:'var(--s-sub)', background:'transparent', border:'none', outline:'none', cursor:'pointer' }}>
                <option value="always">Always</option>
                <option value="3_times">First 3 times</option>
                <option value="never">Never</option>
              </select>
            } />
        </SectionBlock>
      </div>
    </div>
  );

  if (section === 'transcription') return (
    <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
      <SubPageHeader title="Transcription" onBack={goBack} accent={accent} />
      <div style={{ padding: '16px 16px 0' }}>
        <SectionBlock title="AI Model" footer="Fast uses Groq cloud (~2s). Accurate uses local Whisper — slower but private." delay={0.05}>
          {[
            ['fast','Fast','Groq Whisper · cloud'],
            ['balanced','Balanced','Groq → local fallback'],
            ['accurate','Accurate','Local Whisper · private'],
          ].map(([v,l,sub],i) => (
            <Row key={v} delay={0.05+i*0.04} label={l} sub={sub}
              right={settings.transcriptionModel === v ? <Checkmark accent={accent}/> : undefined}
              onClick={() => updateSetting('transcriptionModel', v as any)} />
          ))}
        </SectionBlock>
        <SectionBlock delay={0.22}>
          <Row delay={0.22} icon={<IconBox bg="#007AFF" icon={<Zap size={16}/>}/>}
            label="Auto-Transcribe" sub="Start after recording stops"
            right={<Toggle on={settings.autoTranscribe} accent={accent} onChange={v => updateSetting('autoTranscribe', v)}/>} />
          <Row delay={0.26} icon={<IconBox bg="#AF52DE" icon={<User size={16}/>}/>}
            label="Speaker Detection" sub="Identify multiple speakers"
            right={<Toggle on={settings.speakerDetection} accent={accent} onChange={v => updateSetting('speakerDetection', v)}/>} />
        </SectionBlock>
      </div>
    </div>
  );

  if (section === 'ai') return (
    <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
      <SubPageHeader title="AI & Summarisation" onBack={goBack} accent={accent} />
      <div style={{ padding: '16px 16px 0' }}>
        <SectionBlock title="Summary Style" delay={0.05}>
          {[
            ['executive','Executive','Key points & decisions'],
            ['detailed','Detailed','Full structured notes'],
            ['bullet','Bullet Points','Quick scan format'],
            ['study_guide','Study Guide','Exam-ready format'],
          ].map(([v,l,sub],i) => (
            <Row key={v} delay={0.05+i*0.04} label={l} sub={sub}
              right={settings.summaryType === v ? <Checkmark accent={accent}/> : undefined}
              onClick={() => updateSetting('summaryType', v as any)} />
          ))}
        </SectionBlock>
        <SectionBlock delay={0.25}>
          <Row delay={0.25} icon={<IconBox bg="#FF2D55" icon={<Sparkles size={16}/>}/>}
            label="Auto-Summarise" sub="Run after transcription completes"
            right={<Toggle on={settings.autoSummarize} accent={accent} onChange={v => updateSetting('autoSummarize', v)}/>} />
        </SectionBlock>
        <SectionBlock title="AI Provider" footer="OpenAI and Claude support coming soon." delay={0.32}>
          <Row delay={0.32} label="Google Gemini" sub="Currently active"
            right={<Checkmark accent={accent}/>} />
          <Row delay={0.36} label="OpenAI GPT" disabled right={<span style={{fontSize:13,color:'var(--s-dim)'}}>Soon</span>} />
          <Row delay={0.40} label="Anthropic Claude" disabled right={<span style={{fontSize:13,color:'var(--s-dim)'}}>Soon</span>} />
        </SectionBlock>
      </div>
    </div>
  );

  if (section === 'notifications') return (
    <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
      <SubPageHeader title="Notifications" onBack={goBack} accent={accent} />
      <div style={{ padding: '16px 16px 0' }}>
        <SectionBlock delay={0.05}>
          <Row delay={0.05} icon={<IconBox bg="#FF3B30" icon={<Bell size={16}/>}/>}
            label="Allow Notifications"
            right={<Toggle on={settings.notificationsEnabled} accent={accent} onChange={v => updateSetting('notificationsEnabled', v)}/>} />
          <Row delay={0.09} icon={<IconBox bg="#FF9500" icon={<Clock size={16}/>}/>}
            label="Study Reminders" sub="Daily push notification"
            right={<Toggle on={settings.studyReminders} accent={accent} onChange={handleStudyReminders}/>} />
        </SectionBlock>
      </div>
    </div>
  );

  if (section === 'privacy') return (
    <div className="settings-root animate-slide-right" style={{ paddingBottom: 80 }}>
      <SubPageHeader title="Privacy & Security" onBack={goBack} accent={accent} />
      <div style={{ padding: '16px 16px 0' }}>
        <SectionBlock footer="When on, AI providers may use your anonymised transcripts to improve their models." delay={0.05}>
          <Row delay={0.05} icon={<IconBox bg="#636366" icon={<Database size={16}/>}/>}
            label="AI Training Data" sub="Allow data use for model training"
            right={<Toggle on={settings.aiDataUsage} accent={accent} onChange={v => updateSetting('aiDataUsage', v)}/>} />
          <Row delay={0.09} icon={<IconBox bg="#007AFF" icon={<Globe size={16}/>}/>}
            label="Wi-Fi Only for AI" sub="Saves mobile data — recommended"
            right={<Toggle on={settings.wifiOnly} accent={accent} onChange={v => updateSetting('wifiOnly', v)}/>} />
        </SectionBlock>
        <SectionBlock delay={0.18}>
          <Row delay={0.18} icon={<IconBox bg="#34C759" icon={<Download size={16}/>}/>}
            label="Export All My Data" onClick={handleExport} />
        </SectionBlock>
        <SectionBlock delay={0.26}>
          <Row delay={0.26} label="Delete Account" danger onClick={handleDeleteAccount} />
        </SectionBlock>
      </div>
    </div>
  );

  // ── Root page ─────────────────────────────────────────────────────────────

  const initials = (profile.full_name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const accentEntry = ACCENTS.find(c => c.name === settings.accentColor);
  const themeLabel = settings.theme === 'system' ? 'System' : settings.theme === 'dark' ? 'Dark' : 'Light';

  return (
    <div className="settings-root" style={{ paddingBottom: 96 }}>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ paddingTop: 56, paddingBottom: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:4, color:accent, background:'none', border:'none', cursor:'pointer', fontSize:17, marginBottom:2 }}>
            <ChevronLeft size={20}/> Back
          </button>
          <h1 style={{ fontSize:34, fontWeight:700, letterSpacing:'-0.5px', color:'var(--s-label)', margin:0 }}>
            Settings
          </h1>
        </div>

        {/* Profile card */}
        <div className="s-card animate-fade-up stagger-1"
          style={{ marginTop:24, marginBottom:32, cursor:'pointer', transition:'transform 0.15s' }}
          onClick={() => setIsEditProfileOpen(true)}
          onMouseEnter={e => (e.currentTarget.style.transform='scale(1.01)')}
          onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px' }}>
            {/* Avatar */}
            <div style={{ width:60, height:60, borderRadius:'50%', background:accent, display:'flex',
              alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22, fontWeight:600, color:'#fff',
              boxShadow:`0 4px 16px ${accent}55` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} alt="" />
                : initials}
            </div>
            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:20, fontWeight:600, color:'var(--s-label)', margin:0, lineHeight:1.2,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {profile.full_name || 'Set up your profile'}
              </p>
              <p style={{ fontSize:15, color:'var(--s-sub)', margin:'2px 0 0',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.email}
              </p>
              {(profile.university || profile.year_of_study) && (
                <p style={{ fontSize:13, color:'var(--s-dim)', margin:'2px 0 0',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {[profile.university, profile.year_of_study].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <ChevronRight size={16} style={{ color:'var(--s-dim)', flexShrink:0 }}/>
          </div>
        </div>

        {/* Account */}
        <SectionBlock title="Account" delay={0.1}>
          <Row delay={0.1} icon={<IconBox bg="#636366" icon={<Key size={16}/>}/>}
            label="Change Password" onClick={handleChangePassword}/>
          <Row delay={0.14} icon={<IconBox bg="#34C759" icon={<ShieldCheck size={16}/>}/>}
            label="Email Verification"
            right={<span style={{fontSize:15,color:'var(--s-sub)'}}>Verified</span>}/>
          <Row delay={0.18} icon={<IconBox bg="#FF3B30" icon={<LogOut size={16}/>}/>}
            label="Sign Out" danger onClick={handleSignOut}/>
        </SectionBlock>

        {/* Preferences nav */}
        <SectionBlock title="Preferences" delay={0.22}>
          <Row delay={0.22} icon={<IconBox bg="#5856D6" icon={<Palette size={16}/>}/>}
            label="Appearance"
            sub={`${themeLabel} · ${accentEntry?.label ?? ''}`}
            onClick={() => goTo('appearance')}/>
          <Row delay={0.26} icon={<IconBox bg="#FF3B30" icon={<Mic size={16}/>}/>}
            label="Recording"
            sub={`${settings.audioQuality.charAt(0).toUpperCase()+settings.audioQuality.slice(1)} quality`}
            onClick={() => goTo('recording')}/>
          <Row delay={0.30} icon={<IconBox bg="#007AFF" icon={<Cpu size={16}/>}/>}
            label="Transcription"
            sub={`${settings.transcriptionModel.charAt(0).toUpperCase()+settings.transcriptionModel.slice(1)} model${settings.autoTranscribe?' · Auto':''}`}
            onClick={() => goTo('transcription')}/>
          <Row delay={0.34} icon={<IconBox bg="#FF2D55" icon={<Sparkles size={16}/>}/>}
            label="AI & Summarisation"
            sub={`${settings.summaryType.replace('_',' ')} style${settings.autoSummarize?' · Auto':''}`}
            onClick={() => goTo('ai')}/>
          <Row delay={0.38} icon={<IconBox bg="#FF3B30" icon={<Bell size={16}/>}/>}
            label="Notifications"
            sub={settings.notificationsEnabled ? 'On' : 'Off'}
            onClick={() => goTo('notifications')}/>
          <Row delay={0.42} icon={<IconBox bg="#636366" icon={<Shield size={16}/>}/>}
            label="Privacy & Security"
            onClick={() => goTo('privacy')}/>
        </SectionBlock>

        {/* About */}
        <SectionBlock title="About" delay={0.46}>
          <Row delay={0.46} icon={<IconBox bg="#007AFF" icon={<Info size={16}/>}/>}
            label="App Version"
            right={<span style={{fontSize:15,color:'var(--s-sub)'}}>1.0.0</span>}/>
          <Row delay={0.50} icon={<IconBox bg="#34C759" icon={<MessageSquare size={16}/>}/>}
            label="WhatsApp Community" sub="Group link coming soon"
            onClick={() => showInfo('Coming Soon','WhatsApp study group link will be added here soon.')}/>
          <Row delay={0.54} icon={<IconBox bg="#FF3B30" icon={<HelpCircle size={16}/>}/>}
            label="Built with ❤️ in Kenya 🇰🇪" disabled/>
        </SectionBlock>

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