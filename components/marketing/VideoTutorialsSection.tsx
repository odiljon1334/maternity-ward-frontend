"use client";

import { useState } from "react";
import {
  Play,
  Video,
  Clock,
  CheckCircle2,
  Download,
  ArrowRight,
} from "lucide-react";
import { TUTORIAL_LESSONS } from "./VideoTutorialsModal";

interface VideoTutorialsSectionProps {
  onOpenLesson: (lessonId: string) => void;
}

export function VideoTutorialsSection({ onOpenLesson }: VideoTutorialsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "employees" | "schedules" | "payroll" | "hardware">("all");

  const filterLessons = TUTORIAL_LESSONS.filter((l) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "employees" && l.id.includes("employee")) return true;
    if (selectedCategory === "schedules" && l.id.includes("schedule")) return true;
    if (selectedCategory === "payroll" && (l.id.includes("payroll") || l.id.includes("export"))) return true;
    if (selectedCategory === "hardware" && l.id.includes("terminal")) return true;
    return true;
  });

  return (
    <section id="video-tutorials" className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Video className="w-3.5 h-3.5" />
            <span>Video Qo&apos;llanmalar &amp; Yo&apos;riqnomalar</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Dasturdan foydalanishni 5 daqiqada o&apos;rganing
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            Xodim qo&apos;shish, Face ID rasm yuklash, har bir kunga har xil vaqtdagi smena yaratish, oylik maosh hisoblash va T-13 tabelni Excel/PDF formatida eksport qilish bo&apos;yicha to&apos;liq video darsliklar.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "Barcha Darslar (5)" },
            { id: "employees", label: "👤 Xodimlar & Face ID" },
            { id: "schedules", label: "📅 Har Kungi Smenalar" },
            { id: "payroll", label: "💰 Oylik Maosh & T-13" },
            { id: "hardware", label: "⚙️ 1-2 ta Face ID Sozlash" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/40"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterLessons.map((lesson) => {
            const IconComponent = lesson.icon;
            return (
              <div
                key={lesson.id}
                className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-400 dark:hover:border-blue-800 flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Media Preview Mockup */}
                <div
                  className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4 flex flex-col justify-between cursor-pointer overflow-hidden"
                  onClick={() => onOpenLesson(lesson.id)}
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                      Dars #{lesson.number}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 text-slate-300 font-mono text-[10px] backdrop-blur-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lesson.duration}
                    </span>
                  </div>

                  {/* Play button hover overlay */}
                  <div className="my-auto text-center z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-600/40 group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="z-10">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                      {lesson.badge}
                    </span>
                  </div>

                  {/* Background faint icon */}
                  <div className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none">
                    <IconComponent className="w-28 h-28" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {lesson.shortDesc}
                    </p>
                  </div>

                  {/* Steps preview */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Darsda nimalar o&apos;rgatiladi:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {lesson.steps.slice(0, 2).map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenLesson(lesson.id)}
                      className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Videoni tomosha qilish</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner with Fast Links */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col lg:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2 text-center lg:text-left">
            <h4 className="text-lg font-bold">
              Xodimlarni ommaviy yuklash va T-13 tabel shablonlari kerakmi?
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">
              Excel shablonlarni yuklab olib, o&apos;z xodimlaringiz ro&apos;yxatini 1 daqiqada tayyorlang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLesson("add-employee-faceid")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel Shablonini Olish</span>
            </button>

            <button
              onClick={() => onOpenLesson("custom-schedules")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/30"
            >
              <span>Barcha Darslarni Ko&apos;rish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
