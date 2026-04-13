import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'red' | 'yellow';
export type FontSize = 'small' | 'default' | 'large' | 'extra-large';
export type AudioQuality = 'low' | 'standard' | 'high';
export type RecordingFormat = 'wav' | 'mp3' | 'm4a';
export type SummaryType = 'executive' | 'detailed' | 'bullet' | 'study_guide' | 'mind_map' | 'custom';
export type AIProvider = 'gemini' | 'openai' | 'claude' | 'custom';

export interface SettingsState {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  language: 'english' | 'swahili';
  transcriptLanguage: string; // 'auto', 'english', etc.
  audioQuality: AudioQuality;
  recordingFormat: RecordingFormat;
  autoStop: boolean;
  autoStopDuration: number;
  autoStopSilence: boolean;
  autoStopSilenceThreshold: number;
  backgroundRecording: boolean;
  storageLocation: 'internal' | 'external';
  consentReminder: 'always' | '3_times' | 'never';
  transcriptionModel: 'fast' | 'balanced' | 'accurate';
  autoTranscribe: boolean;
  speakerDetection: boolean;
  timestampInterval: number; // 0 for none, 1, 5, 10
  autoPunctuation: boolean;
  autoCapitalization: boolean;
  removeFillerWords: boolean;
  showConfidenceScores: boolean;
  aiProvider: AIProvider;
  summaryType: SummaryType;
  customSummaryPrompt: string;
  autoSummarize: boolean;
  summaryLanguage: string;
  aiResponseStyle: 'formal' | 'conversational' | 'concise';
  notificationsEnabled: boolean;
  notifyTranscription: boolean;
  notifySummary: boolean;
  notifyStorage: boolean;
  studyReminders: boolean;
  studyReminderTime: string;
  studyReminderDays: number[]; // 0-6
  biometricLock: boolean;
  wifiOnly: boolean;
  analyticsEnabled: boolean;
  aiDataUsage: boolean;
  autoCleanupDays: number | null;
  keepTranscriptsOnCleanup: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'system',
  accentColor: 'blue',
  fontSize: 'default',
  language: 'english',
  transcriptLanguage: 'auto',
  audioQuality: 'standard',
  recordingFormat: 'wav',
  autoStop: false,
  autoStopDuration: 60,
  autoStopSilence: false,
  autoStopSilenceThreshold: 60,
  backgroundRecording: false,
  storageLocation: 'internal',
  consentReminder: 'always',
  transcriptionModel: 'balanced',
  autoTranscribe: true,
  speakerDetection: false,
  timestampInterval: 5,
  autoPunctuation: true,
  autoCapitalization: true,
  removeFillerWords: true,
  showConfidenceScores: false,
  aiProvider: 'gemini',
  summaryType: 'executive',
  customSummaryPrompt: '',
  autoSummarize: false,
  summaryLanguage: 'match',
  aiResponseStyle: 'formal',
  notificationsEnabled: true,
  notifyTranscription: true,
  notifySummary: true,
  notifyStorage: true,
  studyReminders: false,
  studyReminderTime: '20:00',
  studyReminderDays: [1, 2, 3, 4, 5],
  biometricLock: false,
  wifiOnly: true,
  analyticsEnabled: true,
  aiDataUsage: false,
  autoCleanupDays: null,
  keepTranscriptsOnCleanup: true,
};

interface ProfileData {
  full_name: string;
  phone_number: string;
  university: string;
  course: string;
  year_of_study: string;
  preferred_language: string;
  avatar_url?: string;
  joined_at: string;
  recording_consent: boolean;
}

interface SettingsContextType {
  settings: SettingsState;
  profile: ProfileData | null;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showMiniToast } = useNotification();
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('studypro_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('studypro_settings', JSON.stringify(settings));
    
    // Apply theme
    const root = window.document.documentElement;
    const effectiveTheme = settings.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply Accent Color Variable (HACK: using CSS variables)
    const colors: Record<AccentColor, string> = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#a855f7',
      orange: '#f97316',
      pink: '#ec4899',
      teal: '#14b8a6',
      red: '#ef4444',
      yellow: '#eab308'
    };
    root.style.setProperty('--accent-primary', colors[settings.accentColor]);
  }, [settings.theme, settings.accentColor]);

  // Load from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfileAndSettings = async () => {
      try {
        // Use maybeSingle to avoid 406 error when profile doesn't exist yet
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile from Supabase:', error);
          // We don't throw here to allow the app to function with fallback metadata
        }

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            university: data.university || '',
            course: data.course || '',
            year_of_study: data.year_of_study || '',
            preferred_language: data.preferred_language || 'English',
            avatar_url: data.avatar_url,
            joined_at: data.created_at,
            recording_consent: data.recording_consent || false
          });

          if (data.settings) {
            setSettings(prev => ({ ...prev, ...data.settings }));
          }
        } else {
          // Fallback: record doesn't exist in DB, use auth metadata
          const metadata = user.user_metadata || {};
          setProfile({
            full_name: metadata.full_name || '',
            phone_number: metadata.phone || '',
            university: metadata.institution || '',
            course: '',
            year_of_study: '',
            preferred_language: 'English',
            joined_at: user.created_at || new Date().toISOString(),
            recording_consent: metadata.recording_consent === true || metadata.recording_consent === 'true'
          });
          
          // Note: We could auto-create the record here, but we'll let it be for now
          // to avoid side-effects in a fetch effect.
        }
      } catch (err) {
        console.error('Error in profile initialization:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndSettings();
  }, [user]);

  const updateSetting = useCallback(async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    const updatedSettings = { ...settings, [key]: value };

    // Visual feedback for auto-save
    if (key !== 'theme' && key !== 'accentColor') {
       showMiniToast('Saved');
    }

    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ settings: updatedSettings })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error('Error saving setting:', err);
        showError('Sync Failed', 'Could not save your preferences online.');
      }
    }
  }, [user, settings, showError, showMiniToast]);

  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...data } : null);
      showSuccess('Profile Updated', 'Your biological information is safe with your study buddy.');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('Update Failed', 'Could not update profile information.');
    }
  };

  const resetToDefaults = async () => {
    setSettings(DEFAULT_SETTINGS);
    if (user) {
      await supabase.from('profiles').update({ settings: DEFAULT_SETTINGS }).eq('id', user.id);
    }
    showInfo('Restored', 'All settings have been reset to default.');
  };

  return (
    <SettingsContext.Provider value={{ settings, profile, updateSetting, updateProfile, resetToDefaults, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
