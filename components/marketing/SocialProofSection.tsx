"use client";

import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  Quote,
  Star,
} from "lucide-react";

export function SocialProofSection() {
  const stats = [
    {
      value: "120+",
      label: "Tibbiyot muassasalari",
      subtext: "Respublika bo'ylab faol",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "14,800+",
      label: "Shifokor va hamshiralar",
      subtext: "Har kuni Face ID dan o'tadi",
      icon: <Users className="w-5 h-5 text-indigo-600" />,
    },
    {
      value: "99.8%",
      label: "Davomat intizomi",
      subtext: "Kechikishlar 85% ga qisqargan",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      value: "450 mln+",
      label: "So'm tejalgan vaqt va xarajat",
      subtext: "Tabel va hisob-kitob orqali",
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
    },
  ];

  const testimonials = [
    {
      quote:
        "180 nafar xodimimizning 24 soatlik navbatchiligini va tungi smena ustamalarini qog'ozda hisoblash kadrlar bo'limining har oy 4 kunlik vaqtini olar edi. MaternityCare bilan bu jarayon 15 daqiqaga qisqardi. Kechikishlar esa 90% ga kamaydi.",
      author: "Dr. S. Karimov",
      role: "Bosh shifokor",
      hospital: "Samarqand viloyat Perinatal Markazi",
      badge: "180+ xodim",
    },
    {
      quote:
        "Hikvision Face ID terminallari bilan to'g'ridan-to'g'ri ishlashi eng katta yutug'imiz bo'ldi. Internet o'chganda ham terminal o'zida saqlab, internet kelishi bilan serverga uzatadi. Bosh shifokorimiz har kuni soat 08:30 da Telegramda tayyor tahlilni ko'radi.",
      author: "Dr. N. Yo'ldosheva",
      role: "Kadrlar bo'limi boshlig'i",
      hospital: "Toshkent shahar 1-son Tug'ruqxona",
      badge: "120+ xodim",
    },
    {
      quote:
        "Oddiy ofis davomat dasturlari tibbiyotning murakkab smenalarini (kun/tun/sutka) tushunmasdi. Bu tizim aynan shifoxonalar protokollariga moslab yaratilgan. 14 kunlik bepul sinovda to'liq ishonch hosil qilib, 1 yillik tarifga o'tdik.",
      author: "M. Sobirov",
      role: "Klinika ijrochi direktori",
      hospital: "MedLife Ko'p tarmoqli klinikasi",
      badge: "45 xodim",
    },
  ];

  return (
    <section id="results" className="py-20 sm:py-28 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-20">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 text-center space-y-2 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center shadow-xs">
                {s.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {s.value}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {s.label}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {s.subtext}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Real Natijalar &bull; Tibbiyot Rahbarlari Fikri
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Klinika rahbarlari nega bizni tanlamoqda?
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Respublikaning yetakchi tibbiyot birlashmalari va xususiy shifoxonalari tajribasi
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {t.badge}
                  </span>
                </div>

                <Quote className="w-7 h-7 text-blue-600/30" />

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  {t.author.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {t.author}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.role} &bull; {t.hospital}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
