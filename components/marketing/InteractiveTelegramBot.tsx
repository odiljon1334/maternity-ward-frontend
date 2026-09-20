"use client";

import React, { useState } from "react";
import {
  Bot,
  RotateCcw,
} from "lucide-react";

interface InteractiveTelegramBotProps {
  onOpenTrial?: () => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  buttons?: string[];
}

export function InteractiveTelegramBot({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenTrial,
}: InteractiveTelegramBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "👋 Assalomu alaykum, Hurmatli Rahbar!\n\nStaffPulse AI Telegram Boti sizga tashkilotingizdagi davomat, smenalar va intizom haqida real vaqtda hisobot beradi.\n\n👇 Quyidagi tugmalardan birini bosing va bot qanday ishlashini sinab ko'ring:",
      time: "09:00",
      buttons: [
        "📊 Bugungi Davomat",
        "🚨 Kechikkanlar (Top 5)",
        "💰 Avans & Oylik Hisobi",
        "📅 Ertangi Smena",
        "📄 T-13 Oylik Tabel",
      ],
    },
  ]);

  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleCommand = (cmd: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: cmd,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate bot answering with rich markdown-style text
    setTimeout(() => {
      let botResponse = "";

      if (cmd.includes("Bugungi Davomat")) {
        botResponse = `📊 KORXONA JONLI DAVOMATI (Bugun):\n\n👥 Jami ro'yxatda: 142 nafar\n✅ Ish joyida hozir: 128 nafar (90.1%)\n⏱ Vaqtida kelganlar: 121 nafar\n⚠️ Kechikkanlar: 7 nafar\n🌴 Ta'tilda / Kasallik: 5 nafar\n❓ Sababsiz kelmagan: 2 nafar\n\n📌 Turniket va Face ID apparatlari 100% onlayn rejimda ishlamoqda.`;
      } else if (cmd.includes("Kechikkanlar")) {
        botResponse = `🚨 BUGUN KECHIKKAN XODIMLAR:\n\n1. 👨‍💼 Jasur Aliyev (Logistika) — +38 daq (sababsiz)\n2. 👩‍💼 Madina Karimova (Marketing) — +24 daq (transport)\n3. 👨‍💻 Sardor Rahimov (IT bo'lim) — +19 daq\n4. 👩‍⚕️ Nilufar Oripova (Kassir) — +12 daq\n5. 👨‍🔧 Bobur Toshmatov (Ombor) — +9 daq\n\n💡 Barcha kechikkanlarga ogohlantirish SMS/Telegram xabari yuborildi.`;
      } else if (cmd.includes("Avans & Oylik Hisobi")) {
        botResponse = `💰 AVANS VA MAOSH HISOB-KITOBI (Real-vaqtda):\n\n👤 Xodim: Dilshod Qosimov (Sotuv bo'limi)\n📅 Sentabr oyi ishlangan: 17 kun (136 soat)\n💵 Hisoblangan maosh: 5 440 000 so'm\n💳 Ruxsat etilgan avans limiti: 2 720 000 so'm (50%)\n\n⚡️ Xodim Telegram orqali 1 bosishda avans so'rashi mumkin, rahbar esa tasdiqlaydi.`;
      } else if (cmd.includes("Ertangi Smena")) {
        botResponse = `📅 ERTANGI SMENA REJASI (2026-09-20):\n\n🌅 1-Smena (08:00 - 16:00): 45 nafar tasdiqlangan\n🌇 2-Smena (16:00 - 00:00): 32 nafar tasdiqlangan\n🌙 Tungi Navbatchilik (00:00 - 08:00): 12 nafar\n\n🔄 Smena almashinuvi so'rovi: 1 ta (Qabul qilingan).`;
      } else if (cmd.includes("T-13 Oylik Tabel")) {
        botResponse = `📄 RASMIY T-13 TABEL TAYYOR!\n\n📁 Fayl: StaffPulse_Tabel_Sentabr_2026.xlsx\n💾 Hajmi: 342 KB\n💼 1C:Enterprise (ЗУП) uchun to'liq moslashtirilgan.\n\n👇 Buxgalteriya tizimiga to'g'ridan-to'g'ri integratsiya qilish mumkin.`;
      } else {
        botResponse = `✅ Buyruq muvaffaqiyatli qabul qilindi. StaffPulse tizimi korxonangizdagi har bir daqiqani nazorat qiladi.`;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botResponse,
        time: timeStr,
        buttons: [
          "📊 Bugungi Davomat",
          "🚨 Kechikkanlar (Top 5)",
          "💰 Avans & Oylik Hisobi",
          "📅 Ertangi Smena",
          "📄 T-13 Oylik Tabel",
        ],
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 700);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: "👋 Assalomu alaykum, Hurmatli Rahbar!\n\nStaffPulse AI Telegram Boti sizga tashkilotingizdagi davomat, smenalar va intizom haqida real vaqtda hisobot beradi.\n\n👇 Quyidagi tugmalardan birini bosing va bot qanday ishlashini sinab ko'ring:",
        time: "09:00",
        buttons: [
          "📊 Bugungi Davomat",
          "🚨 Kechikkanlar (Top 5)",
          "💰 Avans & Oylik Hisobi",
          "📅 Ertangi Smena",
          "📄 T-13 Oylik Tabel",
        ],
      },
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Bot Chat Header */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-800" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">
                StaffPulse Director Bot
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                AI BOT
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              onlayn • 24/7 jonli bildirishnomalar
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Chatni yangilash"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/70 text-xs sm:text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 whitespace-pre-line leading-relaxed shadow-sm ${
                m.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-xs"
                  : "bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs"
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/60 w-fit px-3 py-2 rounded-xl">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce delay-100">●</span>
            <span className="animate-bounce delay-200">●</span>
            <span className="ml-1 text-[11px]">Bot ma&apos;lumot tayyorlamoqda...</span>
          </div>
        )}
      </div>

      {/* Interactive Command Buttons */}
      <div className="p-3 bg-slate-800/90 border-t border-slate-700 space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 px-1 flex items-center justify-between">
          <span>👇 Sinab ko&apos;rish uchun tugmani bosing:</span>
          <span className="text-blue-400 text-[10px]">Interaktiv Simulyator</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {["📊 Bugungi Davomat", "🚨 Kechikkanlar (Top 5)", "📅 Ertangi Smena", "📄 T-13 Oylik Tabel"].map(
            (cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleCommand(cmd)}
                disabled={isTyping}
                className="py-2 px-3 rounded-xl bg-slate-700/80 hover:bg-blue-600 hover:text-white text-slate-200 text-xs font-semibold border border-slate-600/70 transition-all text-left flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="truncate">{cmd}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
