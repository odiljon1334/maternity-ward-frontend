"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import { Send } from "lucide-react";
import {
  TELEGRAM_DEMO_COMMANDS,
  TELEGRAM_DEMO_WELCOME,
} from "@/lib/marketing/telegram-demo";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

// "**qalin**" belgisini <strong>ga aylantirib, qatorlarni <br/> bilan chiqaradi.
function renderFormatted(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Fragment key={i}>
        {i > 0 && <br />}
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <Fragment key={j}>{part}</Fragment>
          ),
        )}
      </Fragment>
    );
  });
}

export function TelegramBotSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: TELEGRAM_DEMO_WELCOME },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleCommand = (label: string, response: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: label };
    setMessages((prev) => [...prev, userMsg]);
    // Haqiqiy botdek — kichik kechikish bilan javob beradi
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: "bot", text: response },
      ]);
    }, 450);
  };

  return (
    <section className="mx-auto max-w-md">
      <div className="text-center">
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          JONLI DEMO
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Telegram botni sinab ko&apos;ring
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Tugmalardan birini bosing — xuddi haqiqiy StaffPulse botidagidek javob oling.
        </p>
      </div>

      {/* "Telefon" korpusi */}
      <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[#0e1621] shadow-xl">
        {/* Telegram-uslubidagi header */}
        <div className="flex items-center gap-3 bg-[#17212b] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
            SP
          </div>
          <div>
            <div className="text-sm font-medium text-white">StaffPulse Bot</div>
            <div className="text-[11px] text-emerald-400">onlayn</div>
          </div>
        </div>

        {/* Chat oynasi */}
        <div ref={scrollRef} className="h-[320px] space-y-2.5 overflow-y-auto bg-[#0e1621] px-3 py-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "rounded-br-sm bg-indigo-600 text-white"
                    : "rounded-bl-sm bg-[#1f2c38] text-gray-100"
                }`}
              >
                {renderFormatted(m.text)}
              </div>
            </div>
          ))}
        </div>

        {/* Buyruq tugmalari — Telegram reply-keyboard uslubida */}
        <div className="grid grid-cols-1 gap-1.5 bg-[#17212b] p-2.5">
          {TELEGRAM_DEMO_COMMANDS.map((cmd) => (
            <button
              key={cmd.key}
              onClick={() => handleCommand(cmd.label, cmd.response)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#242f3d] py-2.5 text-sm font-medium text-gray-100 transition hover:bg-[#2b3948]"
            >
              {cmd.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-white/5 bg-[#17212b] px-3 py-2 text-xs text-gray-500">
          <Send className="h-3.5 w-3.5" />
          Bu — demo, real xabarlar yubormaydi
        </div>
      </div>
    </section>
  );
}
