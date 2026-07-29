"use client";
import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      setLoading(true);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      // Web Speech API fallback (browser native)
      stream.getTracks().forEach((t) => t.stop());
      setLoading(false);
    };
    recorder.start();
    mediaRef.current = recorder;
    setRecording(true);

    // Browser native speech recognition
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.lang = "uz-UZ";
      recognition.interimResults = false;
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        onTranscript(text);
      };
      recognition.start();
      (window as any).__sr = recognition;
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    (window as any).__sr?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
        ${recording
          ? "bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse"
          : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : recording ? (
        <MicOff size={16} />
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
}
