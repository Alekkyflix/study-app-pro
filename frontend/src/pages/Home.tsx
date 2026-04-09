import { useState, useRef, useEffect } from "react";
import { Upload, Save } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { RecordingInterface } from "../components/RecordingInterface";
import { Waveform } from "../components/Waveform";

export function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>();

  // Initialize audio context on first user interaction
  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  };

  const handleRecord = async () => {
    try {
      await initAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Setup audio analysis
      const audioContext = audioContextRef.current!;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
  };

  const handlePlay = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);

    audio.play();
  };

  const handleSave = async () => {
    if (!lectureTitle.trim()) {
      alert("Please enter a lecture title");
      return;
    }

    if (!audioBlob) {
      alert("No recording to save");
      return;
    }

    try {
      // TODO: Upload to backend/storage
      console.log("Saving lecture:", {
        title: lectureTitle,
        duration,
        size: audioBlob.size,
      });

      alert(`Lecture "${lectureTitle}" saved successfully!`);
      setLectureTitle("");
      setDuration(0);
      setAudioBlob(null);
    } catch (error) {
      console.error("Error saving lecture:", error);
      alert("Failed to save lecture");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col pb-24 md:pb-0">
      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Record Your Lecture
          </h1>
          <p className="text-lg text-gray-600">
            Capture your thoughts, let AI transform them
          </p>
        </div>

        {/* Lecture Title Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Lecture Title
          </label>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="e.g., Physics - Quantum Mechanics 101"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Waveform Display */}
        {(isRecording || audioBlob) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Waveform
              isRecording={isRecording}
              audioContext={audioContextRef.current || undefined}
              analyser={analyserRef.current || undefined}
            />
          </div>
        )}

        {/* Recording Controls */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <RecordingInterface
            isRecording={isRecording}
            onRecord={handleRecord}
            onStop={handleStop}
            onPlay={handlePlay}
            onPause={() => setIsPlaying(false)}
            isPlaying={isPlaying}
            duration={duration}
          />
        </div>

        {/* Action Buttons */}
        {audioBlob && (
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Lecture
            </button>
            <button
              onClick={() => alert("Upload feature coming soon")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isRecording && !audioBlob && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">
              Start recording a new lecture or upload an existing one
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
