import { useState, useRef, useEffect } from "react";
import { Upload, Save, Mic, FileText, MessageSquare, DownloadCloud, Loader, FileUp } from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { RecordingInterface } from "../components/RecordingInterface";
import { Waveform } from "../components/Waveform";
import { ChatPanel } from "../components/ChatPanel";
import { ReportPanel } from "../components/ReportPanel";
import { apiClient, checkWifiOnly } from "../services/api";
import { useNotification } from "../context/NotificationContext";
import { useSettings } from "../context/SettingsContext";
import { EmptyState, InlineLoader, RecordingIndicator, OnboardingTooltip } from "../components/notifications";

export function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lectureTitle, setLectureTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const { showSuccess, showError, showWarning, showInfo, showConsent, setLoading: setGlobalLoading } = useNotification();
  const { settings } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const tutorialDone = localStorage.getItem("studypro_tutorial_done");
    if (!tutorialDone) {
      setShowTooltip(true);
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem("studypro_tutorial_done", "true");
  };

  // Implement auto-stop using settings
  useEffect(() => {
    if (isRecording && settings.autoStop && duration >= settings.autoStopDuration * 60) {
      showInfo("Auto-Stopped", `Recording reached the ${settings.autoStopDuration} minute limit.`);
      handleStop();
    }
  }, [duration, isRecording, settings.autoStop, settings.autoStopDuration]);
  
  // State for managing lecture after saving
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  // Wake Lock sentinel — keeps the screen on during recording
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // Whether the tab went to background during an active recording
  const [tabHiddenDuringRecording, setTabHiddenDuringRecording] = useState(false);

  // Initialize audio context on first user interaction
  const initAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  };

  // Acquire screen Wake Lock — prevents mobile from sleeping during recording
  const acquireWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Wake Lock denied (e.g. low battery mode) — non-fatal, just log
        console.warn('[StudyPro] Screen Wake Lock could not be acquired.');
      }
    }
  };

  // Release Wake Lock — called when recording stops or component unmounts
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Page Visibility listener — warn user if they switch tabs while recording
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        setTabHiddenDuringRecording(true);
        showWarning(
          'Recording Active',
          'Switching tabs on mobile may stop your recording. Keep this tab open.',
        );
      }
      if (!document.hidden) {
        setTabHiddenDuringRecording(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRecording]);

  // Release wake lock when component unmounts (safety net)
  useEffect(() => () => releaseWakeLock(), []);

  const handleRecord = async () => {
    showConsent(async () => {
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

        // --- Wire audioQuality setting to MediaRecorder bitrate ---
        const bitrateMap: Record<string, number> = {
          low: 32_000,
          standard: 64_000,
          high: 128_000,
        };
        const audioBitsPerSecond = bitrateMap[settings.audioQuality] ?? 64_000;

        // Setup media recorder
        const mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond });
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          setAudioBlob(blob);
          showSuccess("Recording Complete", "Your lecture is ready to review");
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;

        // Acquire Wake Lock so the screen stays on during recording
        await acquireWakeLock();

        setIsRecording(true);
        setDuration(0);

        // Start timer
        timerRef.current = window.setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        showError("Microphone Access Failed", "Unable to access microphone. Please check permissions.");
      }
    }, settings.consentReminder);
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

    // Release Wake Lock when recording ends
    releaseWakeLock();
    setTabHiddenDuringRecording(false);
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
      showWarning("Title Required", "Please enter a lecture title");
      return;
    }

    if (!audioBlob) {
      showError("No Audio", "No recording to save");
      return;
    }

    try {
      // --- WiFi-only guard ---
      if (!checkWifiOnly(settings.wifiOnly)) {
        showWarning('WiFi Only', 'You are on mobile data. Disable "WiFi Only" in Settings to upload on cellular.');
        return;
      }

      setLoading(true);
      setGlobalLoading(true, "Saving your lecture...");
      setStatus("Creating lecture...");

      // Step 1: Create lecture entry
      const lectureRes = await apiClient.createLecture(lectureTitle);
      if (!lectureRes.success) {
        throw new Error(lectureRes.error || "Failed to create lecture");
      }

      const lectureId = lectureRes.lecture_id.toString();
      setCurrentLectureId(lectureId);
      
      // Step 2: Upload audio
      setStatus("Uploading audio...");
      const uploadRes = await apiClient.uploadAudio(lectureId, audioBlob);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || "Failed to upload audio");
      }

      showSuccess("Lecture Saved", "Your lecture has been saved successfully");
      setStatus("✅ Lecture saved! Ready for transcription.");
      setDuration(0);
      setAudioBlob(null);

      // Auto transcribe if enabled
      if (settings.autoTranscribe) {
        await handleTranscribe(lectureId);
      }
    } catch (error) {
      console.error("Error saving lecture:", error);
      setStatus(`❌ ${error instanceof Error ? error.message : "Failed to save"}`);
      showError("Save Failed", error instanceof Error ? error.message : "Failed to save lecture", {
        retry: handleSave
      });
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isDocument: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const titleToUse = lectureTitle.trim() || file.name.replace(/\.[^/.]+$/, "") || file.name;
    if (!lectureTitle.trim()) setLectureTitle(titleToUse);

    try {
      setLoading(true);
      setGlobalLoading(true, isDocument ? "Parsing document..." : "Uploading audio...");
      setStatus("Creating lecture...");

      const lectureRes = await apiClient.createLecture(titleToUse);
      if (!lectureRes.success) throw new Error(lectureRes.error || "Failed to create lecture");

      const lectureId = lectureRes.lecture_id.toString();
      setCurrentLectureId(lectureId);
      
      if (isDocument) {
        setStatus("Parsing document...");
        const uploadRes = await apiClient.uploadDocument(lectureId, file);
        if (!uploadRes.success) throw new Error(uploadRes.error || "Failed to parse document");
        showSuccess("Document Uploaded", "Document parsed successfully!");
        setStatus("✅ Document parsed! Ready for summarization.");
        const parsedText = titleToUse + " document parsed via PDF/TXT parser successfully.";
        setTranscript(parsedText);
        if (settings.autoSummarize) {
          await handleSummarize(lectureId, parsedText);
        }
      } else {
        setStatus("Uploading audio...");
        const uploadRes = await apiClient.uploadAudio(lectureId, file);
        if (!uploadRes.success) throw new Error(uploadRes.error || "Failed to upload audio");
        showSuccess("Audio Uploaded", "Audio uploaded successfully!");
        setStatus("✅ Audio uploaded! Ready for transcription.");
        
        if (settings.autoTranscribe) {
          await handleTranscribe(lectureId);
        }
      }
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus(`❌ ${error instanceof Error ? error.message : "Failed to upload"}`);
      showError("Upload Failed", error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      event.target.value = '';
    }
  };

  const handleTranscribe = async (idToTranscribe?: string | React.MouseEvent) => {
    const targetId = typeof idToTranscribe === 'string' ? idToTranscribe : currentLectureId;
    
    if (!targetId) {
      showWarning("Save Required", "Please save a lecture first");
      return;
    }

    try {
      setLoading(true);
      setStatus("🎤 Transcribing audio...");

      const result = await apiClient.transcribeLecture(targetId, settings.transcriptionModel);
      if (!result.success) {
        throw new Error(result.error || "Transcription failed");
      }

      setTranscript(result.transcript || "");
      showSuccess("Transcription Complete", "Your lecture is ready to review");
      setStatus("✅ Transcription complete!");

      if (settings.autoSummarize) {
        await handleSummarize(targetId, result.transcript);
      }
    } catch (error) {
      console.error("Error transcribing:", error);
      showError("Transcription Failed", error instanceof Error ? error.message : "Could not process audio");
      setStatus(`❌ Transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (idToSummarize?: string | React.MouseEvent, currentTranscript?: string) => {
    const targetId = typeof idToSummarize === 'string' ? idToSummarize : currentLectureId;
    const targetTranscript = typeof currentTranscript === 'string' ? currentTranscript : transcript;

    if (!targetId) {
      showWarning("Save Required", "Please save a lecture first");
      return;
    }

    if (!targetTranscript) {
      showWarning("Transcript Required", "Please transcribe the lecture first");
      return;
    }

    try {
      setLoading(true);
      setStatus("📝 Generating summary...");

      const result = await apiClient.summarizeLecture(targetId, settings.summaryType);
      if (!result.success) {
        throw new Error(result.error || "Summarization failed");
      }

      setSummary(result.summary || "");
      showSuccess("Summary Generated", "AI has summarized your lecture");
      setStatus("✅ Summary generated!");
    } catch (error) {
      console.error("Error summarizing:", error);
      showError("Summarization Failed", error instanceof Error ? error.message : "Could not generate summary");
      setStatus(`❌ Summarization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (!transcript) {
      showInfo("Tip", "You need a transcript to chat with AI");
      return;
    }
    setShowChatPanel(true);
  };

  const handleOpenReport = () => {
    if (!summary) {
      showInfo("Tip", "You need a summary to view the report");
      return;
    }
    setShowReportPanel(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24 md:pb-0 text-gray-900 tracking-tight">
      {/* Decorative background glow mimicking subtle WebGL blooms */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-100 blur-3xl rounded-full opacity-50 -z-10 pointer-events-none"></div>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 tracking-tighter">
            Record Your Lecture
          </h1>
          <p className="text-xl font-medium text-gray-500 tracking-tight">
            Capture your thoughts, let AI transform them.
          </p>
        </div>

        {/* Lecture Title Input */}
        <div className="glass-card rounded-3xl p-8 mb-8">
          <label className="block text-sm font-bold tracking-wide uppercase text-gray-400 mb-3 ml-1">
            Lecture Title
          </label>
          <input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="e.g., Physics - Quantum Mechanics 101"
            className="w-full px-6 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-gray-900 transition-all font-medium"
          />
        </div>

        {/* Waveform Display */}
        {isRecording && (
          <div className="flex justify-center mb-6">
            <RecordingIndicator duration={(() => {
              const mins = Math.floor(duration / 60);
              const secs = duration % 60;
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            })()} />
          </div>
        )}

        {(isRecording || audioBlob) && (
          <div className="glass-card rounded-3xl p-8 mb-8 premium-shadow">
            <Waveform
              isRecording={isRecording}
              audioContext={audioContextRef.current || undefined}
              analyser={analyserRef.current || undefined}
            />
          </div>
        )}

        {/* Recording Controls */}
        <div className="glass-card rounded-3xl p-10 mb-8 premium-shadow relative">
          {showTooltip && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
              <OnboardingTooltip 
                message="Tap here to start recording" 
                onDismiss={dismissTooltip} 
              />
            </div>
          )}
          <RecordingInterface
            isRecording={isRecording}
            onRecord={() => {
              handleRecord();
              if (showTooltip) dismissTooltip();
            }}
            onStop={handleStop}
            onPlay={handlePlay}
            onPause={() => setIsPlaying(false)}
            isPlaying={isPlaying}
            duration={duration}
          />
        </div>

        {/* Action Buttons */}
        {audioBlob && !currentLectureId && (
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? <InlineLoader /> : <Save className="w-5 h-5" />}
              {loading ? "" : "Save Lecture"}
            </button>
          </div>
        )}

        {/* Post-Save Actions */}
        {currentLectureId && (
          <div className="glass-card rounded-3xl p-8 space-y-6 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Lecture Actions</h3>
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Saved
              </span>
            </div>

            {/* Status Display */}
            {status && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 font-medium tracking-tight p-4 rounded-2xl text-sm">
                {status}
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleTranscribe}
                disabled={loading || !!transcript}
                className="btn-secondary flex-col py-6 h-auto disabled:bg-gray-50"
              >
                {loading && !transcript ? <InlineLoader /> : <Mic className="w-5 h-5 mb-1" />}
                <span className="text-xs uppercase tracking-wider mt-1">{transcript ? "Transcribed" : "Transcribe"}</span>
              </button>

              <button
                onClick={handleSummarize}
                disabled={loading || !transcript || !!summary}
                className="btn-secondary flex-col py-6 h-auto disabled:bg-gray-50"
              >
                {loading && !summary ? <InlineLoader /> : <FileText className="w-5 h-5 mb-1" />}
                <span className="text-xs uppercase tracking-wider mt-1">{summary ? "Summarized" : "Summarize"}</span>
              </button>

              <button
                onClick={handleOpenChat}
                disabled={!transcript}
                className="btn-secondary flex-col py-6 h-auto disabled:bg-gray-50"
              >
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs uppercase tracking-wider">{transcript ? "Open Chat" : "Chat Requires Transcript"}</span>
              </button>

              <button
                onClick={handleOpenReport}
                disabled={!summary}
                className="btn-secondary flex-col py-6 h-auto disabled:bg-gray-50"
              >
                <DownloadCloud className="w-5 h-5 mb-1" />
                <span className="text-xs uppercase tracking-wider">{summary ? "View Report" : "Report Requires Summary"}</span>
              </button>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <h4 className="font-bold tracking-tight text-gray-900 mb-3">Transcript</h4>
                <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl max-h-40 overflow-y-auto text-sm text-gray-700 leading-relaxed font-medium">
                  {transcript.substring(0, 300)}...
                </div>
              </div>
            )}

            {/* Summary Display */}
            {summary && (
              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-bold tracking-tight text-gray-900 mb-3">Summary</h4>
                <div className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl max-h-40 overflow-y-auto text-sm text-gray-700 leading-relaxed font-medium">
                  {summary.substring(0, 300)}...
                </div>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => {
                setCurrentLectureId(null);
                setStatus("");
                setTranscript("");
                setSummary("");
              }}
              className="w-full mt-4 bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-full transition text-sm flex justify-center items-center gap-2"
            >
              New Lecture
            </button>
          </div>
        )}

        {/* Upload Alternatives */}
        {!isRecording && !currentLectureId && !audioBlob && (
          <>
            <div className="flex items-center gap-4 justify-center mb-8 px-8">
              <div className="h-px bg-gray-200 flex-1"></div>
              <div className="text-xs text-gray-400 font-bold tracking-widest uppercase">Or Upload Directly</div>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <button 
                onClick={() => audioInputRef.current?.click()} 
                disabled={loading}
                className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition border border-gray-100 premium-shadow group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-extrabold tracking-tight text-gray-900">Upload Audio</span>
                <span className="text-xs font-medium text-gray-400 mt-1">MP3, WAV, M4A</span>
              </button>
              
              <button 
                onClick={() => docInputRef.current?.click()} 
                disabled={loading}
                className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition border border-gray-100 premium-shadow group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-sm font-extrabold tracking-tight text-gray-900">Upload Document</span>
                <span className="text-xs font-medium text-gray-400 mt-1">PDF, TXT</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={audioInputRef} 
              onChange={(e) => handleFileUpload(e, false)} 
              accept="audio/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={docInputRef} 
              onChange={(e) => handleFileUpload(e, true)} 
              accept=".pdf,.txt" 
              className="hidden" 
            />
          </>
        )}

        {/* Empty State */}
        {!isRecording && !audioBlob && !currentLectureId && (
          <EmptyState 
            type="lectures" 
            onAction={handleRecord} 
            actionLabel="Start Recording" 
          />
        )}
      </main>

      {/* Chat Panel Modal */}
      {showChatPanel && currentLectureId && (
        <ChatPanel
          lectureId={currentLectureId}
          lectureTitle={lectureTitle}
          transcript={transcript}
          onClose={() => setShowChatPanel(false)}
        />
      )}

      {/* Report Panel Modal */}
      {showReportPanel && (
        <ReportPanel
          lectureTitle={lectureTitle}
          summary={summary}
          transcript={transcript}
          onClose={() => setShowReportPanel(false)}
        />
      )}
    </div>
  );
}
