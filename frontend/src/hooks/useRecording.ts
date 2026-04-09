// useRecording hook for audio capture
import { useState } from "react";
import { audioService } from "../services/audio";

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const startRecording = async () => {
    setIsRecording(true);
    await audioService.startRecording();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const audioBlob = await audioService.stopRecording();
    return audioBlob;
  };

  return { isRecording, duration, startRecording, stopRecording };
}
