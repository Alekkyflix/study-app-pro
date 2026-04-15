import { Send, MessageCircle, BookOpen, AlertTriangle, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { apiClient, ApiError } from "../services/api";

interface Lecture {
  id: string;
  title: string;
  has_transcript: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export function Chat() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingLectures, setFetchingLectures] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load lectures with transcripts on mount
  useEffect(() => {
    apiClient
      .getLectures()
      .then((res) => {
        if (res?.success) {
          const withTranscripts = (res.lectures || []).filter(
            (l: Lecture) => l.has_transcript
          );
          setLectures(withTranscripts);
          if (withTranscripts.length > 0) {
            setSelectedLectureId(withTranscripts[0].id);
          }
        }
      })
      .catch(() => setError("Could not load lectures. Is the server running?"))
      .finally(() => setFetchingLectures(false));
  }, []);

  // Greet when a lecture is selected
  useEffect(() => {
    if (!selectedLectureId) return;
    const lec = lectures.find((l) => l.id === selectedLectureId);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: lec
          ? `I'm ready to answer questions about "${lec.title}". What would you like to know?`
          : "Select a lecture to begin chatting.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setQuotaError(false);
    setError(null);
  }, [selectedLectureId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || !selectedLectureId || loading) return;
    setQuotaError(false);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.sendChatMessage(selectedLectureId, input);
      const aiText = res?.answer || res?.response || "No response from AI.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.isQuotaExceeded) {
          setQuotaError(true);
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setError("Network error. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLecture = lectures.find((l) => l.id === selectedLectureId);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tighter text-gray-900">
                Lecture Assistant
              </h1>
              <p className="text-xs font-semibold text-gray-400">
                {selectedLecture ? selectedLecture.title : "Select a lecture"}
              </p>
            </div>
          </div>

          {/* Lecture Selector */}
          {lectures.length > 0 && (
            <select
              value={selectedLectureId}
              onChange={(e) => setSelectedLectureId(e.target.value)}
              className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 max-w-[160px]"
            >
              {lectures.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-auto">
        {/* Loading lectures */}
        {fetchingLectures && (
          <div className="flex items-center justify-center h-40 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            <span className="text-sm font-bold">Loading lectures…</span>
          </div>
        )}

        {/* No transcripts available */}
        {!fetchingLectures && lectures.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">No transcribed lectures yet.</p>
            <p className="text-sm text-gray-400">
              Record and transcribe a lecture first, then come back to chat.
            </p>
          </div>
        )}

        {/* Messages */}
        {!fetchingLectures && lectures.length > 0 && (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-br-sm"
                      : "bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-sm"
                  }`}
                >
                  <p className="font-medium">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1.5 font-bold flex items-center gap-1 ${
                      msg.role === "user" ? "text-white/50" : "text-gray-400"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quota error banner */}
            {quotaError && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Gemini API quota reached
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You've hit the free tier limit. Please wait a moment and try again.
                  </p>
                </div>
              </div>
            )}

            {/* Generic error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!fetchingLectures && lectures.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-4 sticky bottom-16 md:bottom-0 z-10">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Ask about this lecture…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50 transition"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !selectedLectureId}
              className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-black active:scale-95 disabled:opacity-30 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
