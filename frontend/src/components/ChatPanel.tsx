import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User } from "lucide-react";
import { apiClient } from "../services/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  lectureId: string;
  lectureTitle: string;
  transcript: string;
  onClose: () => void;
}

export function ChatPanel({ lectureId, lectureTitle, transcript, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm your study assistant. I've analyzed "${lectureTitle}" and I'm ready to answer your questions about the lecture. Ask me anything!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await apiClient.sendChatMessage(lectureId, input);
      
      let displayContent = result.success && result.response ? result.response : `Sorry, I couldn't process your request. Error: ${result.error || 'Is the AI linked correctly?'}`;
      
      // Specifically handle Quota/Rate Limit error messages for a better UX
      if (displayContent.includes("429") || displayContent.toLowerCase().includes("quota")) {
        displayContent = "⚠️ Quota limit reached. You are on the Gemini Free Tier, which limits how many questions you can ask per minute. Please wait 60 seconds and try again, or check your API key status in the Supabase Dashboard.";
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: displayContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! Something went wrong reaching the backend.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center md:justify-center z-50">
      <div className="bg-white w-full md:w-2xl md:max-h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="font-bold tracking-tight text-gray-900 text-lg">Study Assistant</h3>
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase mt-0.5 max-w-[250px] md:max-w-md truncate">RE: {lectureTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fafafa]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              <div
                className={`max-w-[85%] lg:max-w-[75%] py-3 px-5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-gray-100 text-gray-900 rounded-tr-sm"
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>
                <span className="text-[11px] font-bold text-gray-400 mt-2 block tracking-wider uppercase">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 flex items-end">
                  {/* Keep it minimal, no user icon required but we put a small indicator */}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
              <div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm py-4 px-5 flex items-center h-[52px]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-5 bg-white border-t border-gray-50"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the lecture..."
              className="flex-1 px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 font-medium transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:bg-black hover:scale-105 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs font-medium text-gray-400 mt-4 text-center">
            💡 Try asking: "What are the key concepts?" or "Explain the main topic"
          </p>
        </form>
      </div>
    </div>
  );
}
