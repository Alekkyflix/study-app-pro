import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  audioUrl?: string;
  isRecording?: boolean;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
}

export function Waveform({
  audioUrl,
  isRecording = false,
  audioContext,
  analyser,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize WaveSurfer for playback
  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#e5e7eb",
      progressColor: "#2563eb",
      height: 64,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
    });

    wavesurferRef.current.load(audioUrl);

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [audioUrl]);

  // Real-time frequency visualization for recording
  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = `rgb(37, 99, 235)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, analyser]);

  if (isRecording && analyser) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          width={500}
          height={80}
          className="w-full h-20 rounded"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-gray-50 rounded-lg overflow-hidden"
    />
  );
}
