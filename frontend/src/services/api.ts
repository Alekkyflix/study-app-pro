import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------
const getAuthHeaders = async (
  extra: Record<string, string> = {}
): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { ...extra, Authorization: `Bearer ${session.access_token}` };
  }
  return extra;
};

// ---------------------------------------------------------------------------
// Core fetch wrapper — adds auth, timeout, and structured error handling
// ---------------------------------------------------------------------------
async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = await getAuthHeaders(
      (options.headers as Record<string, string>) ?? {}
    );
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `Request failed: ${res.status}`;
      try {
        const body = await res.json();
        detail = body?.detail ?? detail;
      } catch {}
      throw new ApiError(detail, res.status);
    }

    return res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    throw new ApiError('Network error — check your connection.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------
export class ApiClient {
  getLectures() {
    return apiFetch('/api/lectures');
  }

  getLecture(id: string) {
    return apiFetch(`/api/lectures/${id}`);
  }

  createLecture(title: string, description?: string) {
    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    return apiFetch('/api/lectures', { method: 'POST', body: formData });
  }

  uploadAudio(lectureId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    return apiFetch(`/api/lectures/${lectureId}/upload-audio`, {
      method: 'POST',
      body: formData,
    });
  }

  uploadDocument(lectureId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/api/lectures/${lectureId}/upload-document`, {
      method: 'POST',
      body: formData,
    });
  }

  transcribeLecture(lectureId: string) {
    return apiFetch(`/api/lectures/${lectureId}/transcribe`, { method: 'POST' });
  }

  summarizeLecture(lectureId: string, summaryType = 'executive') {
    return apiFetch(
      `/api/lectures/${lectureId}/summarize?summary_type=${summaryType}`,
      { method: 'POST' }
    );
  }

  sendChatMessage(lectureId: string, message: string) {
    return apiFetch(`/api/lectures/${lectureId}/chat/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  }

  getChatHistory(lectureId: string) {
    return apiFetch(`/api/lectures/${lectureId}/chat/history`);
  }

  clearChatHistory(lectureId: string) {
    return apiFetch(`/api/lectures/${lectureId}/chat/history`, {
      method: 'DELETE',
    });
  }

  generateReport(lectureIds: string[], reportType: string) {
    return apiFetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lecture_ids: lectureIds, report_type: reportType }),
    });
  }

  deleteLecture(id: string) {
    return apiFetch(`/api/lectures/${id}`, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();