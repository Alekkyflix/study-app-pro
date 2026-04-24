/**
 * LectureCard — compact card component for rendering a lecture in list views.
 * Used by Library and any other list showing lecture summaries.
 */
import { FileText, Clock, Mic } from "lucide-react";

interface LectureCardProps {
  id: string;
  title: string;
  description?: string;
  duration?: number;        // seconds
  hasTranscript?: boolean;
  hasSummary?: boolean;
  createdAt?: string;
  onClick?: () => void;
}

export function LectureCard({
  title,
  description,
  duration,
  hasTranscript,
  hasSummary,
  createdAt,
  onClick,
}: LectureCardProps) {
  const fmtDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`glass-card rounded-2xl p-5 border border-gray-100 transition-all ${
        onClick ? "cursor-pointer hover:shadow-lg active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 tracking-tight truncate">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {duration != null && duration > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                <Clock className="w-3 h-3" />
                {fmtDuration(duration)}
              </span>
            )}
            {hasTranscript && (
              <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <Mic className="w-3 h-3" />
                Transcribed
              </span>
            )}
            {hasSummary && (
              <span className="text-xs text-green-600 font-semibold">Summarized</span>
            )}
            {createdAt && (
              <span className="text-xs text-gray-300 ml-auto">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
