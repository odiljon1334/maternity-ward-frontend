"use client";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, RefreshCw, Maximize2, Volume2, VolumeX, Mic, MicOff } from "lucide-react";

interface VideoPlayerProps {
  src: string;           // HLS (.m3u8) URL
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  cameraId?: string;     // Two-way audio uchun
}

// ─── WebSocket base URL ─────────────────────────────────────────────────────
function getWsBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api/v1";
  return api
    .replace(/^https/, "wss")
    .replace(/^http/, "ws")
    .replace(/\/api\/v1\/?$/, "");
}

export function VideoPlayer({
  src,
  title,
  className,
  autoPlay = true,
  muted = true,
  cameraId,
}: VideoPlayerProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef       = useRef<Hls | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(true);

  // ── Two-way audio state ──────────────────────────────────────────────────
  const [micActive, setMicActive]   = useState(false);
  const [micError,  setMicError]    = useState<string | null>(null);
  const wsRef       = useRef<WebSocket | null>(null);
  const ctxRef      = useRef<AudioContext | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const initPlayer = () => {
    const video = videoRef.current;
    if (!video || !src) return;

    setStatus("loading");
    setErrorMsg("");

    // Oldingi instance ni tozalash
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker:         true,
        lowLatencyMode:       true,
        backBufferLength:     10,
        maxLiveSyncPlaybackRate: 1.5,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("playing");
        if (autoPlay) video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus("error");
          setErrorMsg(data.details ?? "Stream xatosi");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — native HLS
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setStatus("playing");
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setStatus("error");
        setErrorMsg("Video yuklanmadi");
      });
    } else {
      setStatus("error");
      setErrorMsg("Brauzeringiz HLS ni qo'llab-quvvatlamaydi");
    }
  };

  useEffect(() => {
    initPlayer();
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // ── Mic cleanup ────────────────────────────────────────────────────────────
  const stopMic = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ event: "stop-audio" }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setMicActive(false);
  };

  // ── Mic start ─────────────────────────────────────────────────────────────
  const startMic = async () => {
    if (!cameraId) return;
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 8 000 Hz AudioContext — Hikvision G.711 uchun
      const ctx = new AudioContext({ sampleRate: 8000 });
      ctxRef.current = ctx;

      const source    = ctx.createMediaStreamSource(stream);
      // bufferSize=1024, 1 input ch, 1 output ch
      const processor = ctx.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      // WebSocket
      const ws = new WebSocket(`${getWsBase()}/ws/audio`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ event: "start-audio", data: { cameraId } }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "audio-started") setMicActive(true);
          if (msg.event === "error") { setMicError(msg.data); stopMic(); }
        } catch {}
      };

      ws.onerror = () => { setMicError("WebSocket xatosi"); stopMic(); };
      ws.onclose = () => { if (micActive) stopMic(); };

      processor.onaudioprocess = (ev) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const float32 = ev.inputBuffer.getChannelData(0);
        const int16   = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }
        wsRef.current.send(int16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (err: any) {
      setMicError(err.message ?? "Mikrofon xatosi");
    }
  };

  const toggleMic = () => {
    if (micActive) stopMic();
    else startMic();
  };

  // cleanup on unmount
  useEffect(() => () => stopMic(), []);

  return (
    <div ref={containerRef} className={cn("relative bg-black rounded-xl overflow-hidden group", className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={muted}
        playsInline
        autoPlay={autoPlay}
      />

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-gray-400">Stream yuklanmoqda...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-xs text-red-300">{errorMsg || "Ulanishda xato"}</p>
            <button
              onClick={initPlayer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Qayta urinish
            </button>
          </div>
        </div>
      )}

      {/* Title + controls (hover da ko'rinadi) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
        {title && <p className="text-white text-xs font-medium truncate">{title}</p>}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleMute}
            className="p-1 rounded text-white/70 hover:text-white transition-colors"
            title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {cameraId && (
            <button
              onClick={toggleMic}
              className={cn(
                "p-1 rounded transition-colors",
                micActive
                  ? "text-red-400 hover:text-red-300 animate-pulse"
                  : "text-white/70 hover:text-white"
              )}
              title={micActive ? "Mikrofonni o'chirish" : "Mikrofon (terminal ga gapirish)"}
            >
              {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={handleFullscreen}
            className="p-1 rounded text-white/70 hover:text-white transition-colors"
            title="To'liq ekran"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live badge */}
      {status === "playing" && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  );
}
