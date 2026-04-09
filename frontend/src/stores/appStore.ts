// Zustand store for app state
import { create } from "zustand";

interface AppState {
  currentLecture: any | null;
  setCurrentLecture: (lecture: any) => void;
  transcribing: boolean;
  setTranscribing: (value: boolean) => void;
  summarizing: boolean;
  setSummarizing: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentLecture: null,
  setCurrentLecture: (lecture) => set({ currentLecture: lecture }),
  transcribing: false,
  setTranscribing: (value) => set({ transcribing: value }),
  summarizing: false,
  setSummarizing: (value) => set({ summarizing: value })
}));
