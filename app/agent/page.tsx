"use client";
import AgentChat from "@/components/agent/AgentChat";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AgentPage() {
  return (
    <div className="flex h-screen bg-[var(--bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden">
        <AgentChat />
      </main>
    </div>
  );
}