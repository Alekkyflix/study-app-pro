import { X, Bot } from "lucide-react";

interface ChatPanelProps {
  lectureId: string;
  lectureTitle: string;
  transcript: string;
  onClose: () => void;
}

export function ChatPanel({ lectureId, lectureTitle, transcript, onClose }: ChatPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center md:justify-center z-50">
      <div className="bg-white w-full md:w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col items-center justify-center p-12 relative text-center border border-gray-100 min-h-[400px]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">AI Chat Disabled</h2>
        <p className="text-gray-500 font-medium tracking-wide">
          This feature is part of our upcoming Premium Tier. Stay tuned!
        </p>
        <div className="mt-8 px-6 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold tracking-widest uppercase inline-block">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
