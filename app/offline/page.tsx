"use client";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="card p-10 flex flex-col items-center gap-5 max-w-sm w-full text-center">
        <div className="p-5 rounded-full bg-indigo-600/20 border border-indigo-500/30">
          <WifiOff className="w-10 h-10 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">Internet aloqasi yo'q</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Tarmoq bilan ulanishni tekshiring va qayta urinib ko'ring.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Qayta urinish
        </button>
      </div>
    </div>
  );
}
