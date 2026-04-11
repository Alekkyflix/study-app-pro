import { supabase } from '../lib/supabase';

// API client for backend communication
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeaders = async (existingHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      ...existingHeaders,
      'Authorization': `Bearer ${session.access_token}`
    };
  }
  return existingHeaders;
};

export class ApiClient {
  async getLectures() {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures`, { headers });
    return res.json();
  }

  async getLecture(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${id}`, { headers });
    return res.json();
  }

  async createLecture(title: string, description?: string) {
    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures`, {
      method: "POST",
      headers,
      body: formData
    });
    return res.json();
  }

  async uploadAudio(lectureId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/upload-audio`, {
      method: "POST",
      headers,
      body: formData
    });
    return res.json();
  }

  async uploadDocument(lectureId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/upload-document`, {
      method: "POST",
      headers,
      body: formData
    });
    return res.json();
  }

  async transcribeLecture(lectureId: string, method: string = "auto") {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/transcribe`, {
      method: "POST",
      headers,
      body: JSON.stringify({ method })
    });
    return res.json();
  }

  async getTranscript(lectureId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/transcript`, { headers });
    return res.json();
  }

  async summarizeLecture(lectureId: string, summaryType: string = "executive") {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/summarize`, {
      method: "POST",
      headers,
      body: JSON.stringify({ summary_type: summaryType })
    });
    return res.json();
  }

  async getSummary(lectureId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/summary`, { headers });
    return res.json();
  }

  async sendChatMessage(lectureId: string, query: string) {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query })
    });
    return res.json();
  }

  async generateReport(lectureIds: string[], reportType: string) {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch(`${API_URL}/api/reports/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ lecture_ids: lectureIds, report_type: reportType })
    });
    return res.json();
  }

  async deleteLecture(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/lectures/${id}`, {
      method: "DELETE",
      headers
    });
    return res.json();
  }
}

export const apiClient = new ApiClient();
