"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileDown, Trash2 } from "lucide-react";
import VoiceInput from "./VoiceInput";
import ToolResultCard from "./ToolResultCard";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  toolResults?: { toolName: string; result: any }[];
  time: string;
}

const QUICK_ACTIONS = [
  { label: "📊 Mart davomati",   query: "Mart oyidagi barcha xodimlar davomat xulosasini ko'rsating" },
  { label: "💰 Maosh hisoblash", query: "Barcha xodimlarning mart oyidagi maoshini hisoblang" },
  { label: "📅 Hafta jadvali",   query: "Kelgusi hafta shift jadvalini ko'rsating" },
  { label: "👥 Xodimlar",        query: "Barcha xodimlar ro'yxatini ko'rsating" },
];

const now = () =>
  new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
const STORAGE_KEY = "agent-chat-history";

const WELCOME_MSG: Message = {
  id: "0",
  role: "assistant",
  content: "Assalomu alaykum! Men Maternity Ward AI assistantiman 🏥\nXodimlar, davomat, maosh va jadval bo'yicha yordam bera olaman.",
  time: "",
};

export default function AgentChat() {
  // useState ni yangilash
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

 // 1. Scroll
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

// 2. localStorage tiklash + welcome vaqti
useEffect(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Message[] = JSON.parse(saved);
      if (parsed.length > 0) {
        setMessages(parsed);
        historyRef.current = parsed
          .filter(m => m.content)
          .map(m => ({ role: m.role, content: m.content }));
        return;
      }
    }
  } catch {}
  setMessages(prev => prev.map(m =>
    m.id === "0" ? { ...m, time: now() } : m
  ));
}, []);

// 3. localStorage saqlash
useEffect(() => {
  if (messages.length > 1) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }
}, [messages]);

const clearChat = () => {
  localStorage.removeItem(STORAGE_KEY);
  historyRef.current = [];
  setMessages([WELCOME_MSG]);
};

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, time: now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);

    // History uchun
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ];

    const getToken = () => {
      const match = document.cookie.match(/auth_token=([^;]+)/);
      return match ? match[1] : localStorage.getItem("access_token") ?? "";
    };

    // Assistant placeholder
    const aId = (Date.now() + 1).toString();
    setMessages((p) => [
      ...p,
      { id: aId, role: "assistant", content: "", toolResults: [], time: now() },
    ]);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyRef.current,
          token: getToken(),
        }),
    });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let toolResults: { toolName: string; result: any }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "text") {
              fullText += data.delta;
              setMessages((p) =>
                p.map((m) => (m.id === aId ? { ...m, content: fullText } : m))
              );
            }

            if (data.type === "tool_result") {
              toolResults = [...toolResults, { toolName: data.toolName, result: data.result }];
              setMessages((p) =>
                p.map((m) => (m.id === aId ? { ...m, toolResults } : m))
              );
            }
          } catch {}
        }
      }

      // History ga qo'shamiz
      historyRef.current = [...historyRef.current, { role: "assistant", content: fullText }];
    } catch (e) {
      setMessages((p) =>
        p.map((m) =>
          m.id === aId ? { ...m, content: "Xatolik yuz berdi. Qayta urinib ko'ring." } : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  const exportPDF = () => {
    const content = messages
      .map((m) => `[${m.role.toUpperCase()}] ${m.time}\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-hisobot-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B0F1A] text-slate-100">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111827]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-teal-500/30 border border-teal-500/30 flex items-center justify-center text-lg">
          🏥
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Maternity AI Agent</p>
          <p className="text-[11px] text-slate-500 truncate">NestJS · PostgreSQL · Claude</p>
        </div>
        <button
          onClick={exportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-colors"
        >
          <FileDown size={13} /> Eksport
        </button>

        <button 
          onClick={clearChat} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 text-xs transition-colors"
          >
            <Trash2 size={13} /> 
            Tozalash
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto border-b border-white/5 scrollbar-none">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.query)}
            disabled={streaming}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs hover:border-blue-500/50 hover:text-blue-300 transition-all disabled:opacity-40"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={15} className="text-teal-400" />
              </div>
            )}

            <div className={`max-w-[80%] sm:max-w-[70%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 rounded-br-sm text-white"
                  : "bg-[#1A2235] border border-white/10 rounded-bl-sm text-slate-100"
              }`}>
                {msg.content || (
                  <span className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={13} className="animate-spin" /> Javob tayyorlanmoqda...
                  </span>
                )}
              </div>

              {/* Tool results */}
              {msg.toolResults && msg.toolResults.length > 0 && (
                <div className="w-full space-y-1">
                  {msg.toolResults.map((tr, i) => (
                    <ToolResultCard key={i} toolName={tr.toolName} result={tr.result} />
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-600 px-1">{msg.time}</span>
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={15} className="text-blue-400" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10 bg-[#111827]">
        <div className="flex items-end gap-2 bg-[#1A2235] border border-white/10 rounded-2xl px-4 py-2 focus-within:border-blue-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Savol yozing..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-slate-100 placeholder-slate-600 max-h-32 py-1.5"
          />
          <div className="flex items-center gap-2 pb-1">
            <VoiceInput onTranscript={(t) => setInput((p) => p + t)} disabled={streaming} />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
            >
              {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-2">Enter — yuborish · Shift+Enter — yangi qator</p>
      </div>
    </div>
  );
}
