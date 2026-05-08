import { Search, Download, Trash2, Clock, BookOpen, FileText, Mic, MessageSquare, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { ChatPanel } from "../components/ChatPanel";
import { useNotification } from "../context/NotificationContext";
import { EmptyState, InlineLoader, LectureSkeleton } from "../components/notifications";

interface Lecture {
  id: string;
  title: string;
  created_at: string;
  duration: number;
  audio_url?: string;
}

export function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [selectedLectureDetails, setSelectedLectureDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const { showModal, showSuccess, showError, showInfo } = useNotification();

  useEffect(() => {
    async function loadLectures() {
      try {
        const res = await apiClient.getLectures();
        if (res.success) {
          setLectures(res.lectures);
        }
      } catch (error) {
        console.error("Error fetching lectures:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLectures();
  }, []);

  const handleSelectLecture = async (id: string) => {
    if (selectedLectureId === id) return;
    setSelectedLectureId(id);
    setSelectedLectureDetails(null);
    setLoadingDetails(true);
    try {
      const res = await apiClient.getLecture(id);
      if (res.success) {
        setSelectedLectureDetails(res.lecture);
      }
    } catch (error) {
      console.error("Error fetching lecture details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async (id: string) => {
    showModal({
      title: "Delete this lecture?",
      body: "This will permanently delete the recording, transcript and summary. This cannot be undone.",
      confirmText: "Delete Lecture",
      confirmStyle: "destructive",
      onConfirm: async () => {
        try {
          const res = await apiClient.deleteLecture(id);
          if (res.success) {
            setLectures((prev) => prev.filter((l) => l.id !== id));
            showSuccess("Lecture Deleted", "Lecture removed from your library");
            if (selectedLectureId === id) {
              setSelectedLectureId(null);
              setSelectedLectureDetails(null);
            }
          } else {
            showError("Delete Failed", "Failed to delete the lecture.");
          }
        } catch (error) {
          console.error("Error deleting:", error);
          showError("Error", "Could not delete lecture. Please try again.");
        }
      }
    });
  };

  const handleGenerateSummary = async () => {
    if (!selectedLectureId) return;
    setIsSummarizing(true);
    try {
      const res = await apiClient.summarizeLecture(selectedLectureId);
      if (res.success) {
        showSuccess("Summary Generated", "AI has summarized your lecture");
        const detailsRes = await apiClient.getLecture(selectedLectureId);
        if (detailsRes.success) {
          setSelectedLectureDetails(detailsRes.lecture);
        }
        const listRes = await apiClient.getLectures();
        if (listRes.success) setLectures(listRes.lectures);
      } else {
        showError("Summarization Failed", (res.error || "Unknown error from server."));
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      showError("Connection Error", "Error reaching the server. Please check your connection.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadTranscript = (title: string, summary: string, transcript: string) => {
    if (!transcript && !summary) {
      showInfo("Nothing to Download", "This lecture has no transcript or summary yet.");
      return;
    }
    const textContent = [
      `STUDYPRO EXPORT`,
      `${'='.repeat(50)}`,
      `Title: ${title}`,
      `Exported: ${new Date().toLocaleString()}`,
      `${'='.repeat(50)}`,
      '',
      summary ? `SUMMARY\n${'-'.repeat(40)}\n${summary}` : '',
      '',
      transcript ? `FULL TRANSCRIPT\n${'-'.repeat(40)}\n${transcript}` : '',
    ].filter(Boolean).join('\n');
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = async (lectureId: string, title: string) => {
    setIsDownloadingAudio(true);
    try {
      const res = await apiClient.getAudioDownloadUrl(lectureId);
      if (!res?.success || !res?.url) {
        showError("No Audio", "No audio file found for this lecture.");
        return;
      }
      // Trigger browser download using a temporary anchor
      const a = document.createElement("a");
      a.href = res.url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_audio.webm`;
      a.target = "_blank"; // fallback for cross-origin signed URLs
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSuccess("Download Started", "Your audio file is downloading.");
    } catch {
      showError("Download Failed", "Could not retrieve the audio file.");
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const filtered = lectures.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-8 text-gray-900 tracking-tight">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gray-100 blur-3xl rounded-full opacity-50 -z-10 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 py-12 z-10">
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tighter">Lecture Library</h1>
          <p className="text-xl font-medium text-gray-500 tracking-tight">Browse and manage your recorded lectures</p>
        </div>

        <div className="glass-card rounded-2xl p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 glass-card rounded-3xl overflow-hidden flex flex-col h-[600px] md:h-[700px] premium-shadow">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h2 className="font-bold tracking-tight text-gray-900 text-lg">Files ({filtered.length})</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <LectureSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => handleSelectLecture(lecture.id)}
                    className={`w-full text-left p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 ${
                      selectedLectureId === lecture.id
                        ? "bg-gray-900 text-white shadow-xl transform scale-[1.02]"
                        : "hover:bg-gray-50 border-transparent text-gray-900"
                    } border`}
                  >
                    <div className={`p-3 rounded-xl shrink-0 transition-colors ${selectedLectureId === lecture.id ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold tracking-tight line-clamp-1 ${selectedLectureId === lecture.id ? "text-white" : "text-gray-900"}`}>
                        {lecture.title}
                      </h3>
                      <div className={`flex items-center gap-3 mt-1.5 text-xs font-medium ${selectedLectureId === lecture.id ? "text-gray-300" : "text-gray-500"}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}
                        </span>
                        <span>{lecture.created_at ? new Date(lecture.created_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState type="search" />
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 glass-card rounded-3xl p-8 min-h-[600px] md:h-[700px] flex flex-col premium-shadow">
            {!selectedLectureId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-16 h-16 mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-500">Select a file to preview</p>
                <p className="text-sm text-gray-400">View transcripts, summaries, and details</p>
              </div>
            ) : loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
                <p className="text-gray-500 font-bold">Fetching details...</p>
              </div>
            ) : selectedLectureDetails ? (
              <div className="flex flex-col h-full overflow-y-auto pr-2">
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100 shrink-0">
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tighter text-gray-900 mb-2">
                      {selectedLectureDetails.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(selectedLectureDetails.duration / 60)}:{(selectedLectureDetails.duration % 60).toString().padStart(2, '0')}
                      </span>
                      <span>
                        {selectedLectureDetails.created_at ? new Date(selectedLectureDetails.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLectureDetails.transcript && (
                      <button
                        onClick={() => setShowChat(true)}
                        className="btn-icon"
                        title="Chat with AI"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    )}
                    {/* Download audio */}
                    <button
                      onClick={() => handleDownloadAudio(selectedLectureDetails.id, selectedLectureDetails.title)}
                      disabled={isDownloadingAudio}
                      className="btn-icon disabled:opacity-40"
                      title="Download Audio"
                    >
                      {isDownloadingAudio
                        ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                        : <Headphones className="w-5 h-5" />}
                    </button>
                    {/* Download transcript + summary as .txt */}
                    <button
                      onClick={() => handleDownloadTranscript(selectedLectureDetails.title, selectedLectureDetails.summary, selectedLectureDetails.transcript)}
                      className="btn-icon"
                      title="Download Transcript"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedLectureDetails.id)}
                      className="p-4 rounded-full border border-gray-200 bg-white text-red-500 hover:border-red-200 hover:bg-red-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-sm"
                      title="Delete Lecture"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                    </div>
                    {selectedLectureDetails.summary ? (
                      <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100/50 text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedLectureDetails.summary}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-14 h-14 bg-white shadow-sm border border-gray-100 text-gray-900 rounded-full flex items-center justify-center mb-2">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-lg">No Summary Available</h4>
                          <p className="text-sm font-medium text-gray-500 max-w-sm mb-4">Generate an AI-powered summary to condense this lecture into its core key concepts.</p>
                        </div>
                        <button
                          onClick={handleGenerateSummary}
                          disabled={isSummarizing || !selectedLectureDetails.transcript}
                          className="btn-primary shadow-xl hover:shadow-2xl"
                        >
                          {isSummarizing
                            ? <InlineLoader />
                            : <div className="flex items-center gap-2">
                                <div className="w-5 h-5 flex items-center justify-center">
                                  <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse" />
                                </div>
                                Generate AI Summary
                              </div>
                          }
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mic className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
                    </div>
                    {selectedLectureDetails.transcript ? (
                      <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-50 text-gray-700 whitespace-pre-wrap leading-relaxed font-serif">
                        {selectedLectureDetails.transcript}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg">No transcript available.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <p>Could not load lecture details.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChat && selectedLectureDetails && (
        <ChatPanel
          lectureId={selectedLectureDetails.id}
          lectureTitle={selectedLectureDetails.title}
          transcript={selectedLectureDetails.transcript || ""}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}