import { Mic, Square, Play, Pause } from "lucide-react";
import { useState, useEffect } from "react";

interface RecordingInterfaceProps {
  isRecording?: boolean;
  onRecord?: () => void;
  onStop?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  duration?: number;
}

export function RecordingInterface({
  isRecording = false,
  onRecord,
  onStop,
  onPlay,
  onPause,
  isPlaying = false,
  duration = 0,
}: RecordingInterfaceProps) {
  const [displayTime, setDisplayTime] = useState("00:00:00");

  useEffect(() => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    setDisplayTime(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    );
  }, [duration]);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Timer Display */}
      <div className="text-center">
        <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
          {displayTime}
        </div>
        <p className="text-sm text-gray-500">
          {isRecording ? "Recording..." : isPlaying ? "Playing..." : "Ready"}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {/* Record Button */}
        {!isRecording ? (
          <button
            onClick={onRecord}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full p-6 shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            <Mic className="w-8 h-8" />
          </button>
        ) : (
          <button
            onClick={onStop}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-6 shadow-lg transition transform hover:scale-105 active:scale-95"
          >
            <Square className="w-8 h-8" />
          </button>
        )}

        {/* Play/Pause Button */}
        {!isRecording && (
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!duration}
            className={`rounded-full p-6 shadow-lg transition transform hover:scale-105 active:scale-95 ${
              duration
                ? isPlaying
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </button>
        )}
      </div>

      {/* Status Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Recording in progress...</span>
        </div>
      )}
    </div>
  );
}
