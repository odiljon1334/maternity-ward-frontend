"use client";

import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  Quote,
} from "lucide-react";

export function SocialProofSection() {
  // Faqat mahsulotning tekshiriladigan imkoniyatlari — o'ylab topilgan
  // mijozlar soni / tejalgan summa kabi raqamlar ko'rsatilmaydi.
  const stats = [
    {
      value: "14 kun",
      label: "Bepul sinov",
      subtext: "Karta va shartnomasiz",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
    },
    {
      value: "24/7",
      label: "Smena va navbatchilik",
      subtext: "Kunduzgi, tungi, sutkalik",
      icon: <Users className="w-5 h-5 text-indigo-600" />,
    },
    {
      value: "Face ID + GPS",
      label: "Davomat isboti",
      subtext: "Terminal yoki telefon orqali",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      value: "08:30",
      label: "Telegram hisobot",
      subtext: "Har kuni rahbarga avtomatik",
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
    },
  ];

  const testimonials = [
    {
      quote:
        "180 nafar xodimimizning 24 soatlik navbatchiligini va tungi smena ustamalarini qog'ozda hisoblash kadrlar bo'limining har oy 4 kunlik vaqtini olar edi. Tizim bilan bu hisob avtomatik bo'ladi, kechikishlar esa darhol ko'rinadi.",
      author: "Bosh shifokor",
      role: "Namunaviy stsenariy",
      hospital: "Viloyat perinatal markazi",
      badge: "Misol",
    },
    {
      quote:
        "Hikvision Face ID terminallari bilan to'g'ridan-to'g'ri ishlashi eng katta yutug'imiz bo'ldi. Internet o'chganda ham terminal o'zida saqlab, internet kelishi bilan serverga uzatadi. Bosh shifokorimiz har kuni soat 08:30 da Telegramda tayyor tahlilni ko'radi.",
      author: "Kadrlar bo'limi boshlig'i",
      role: "Namunaviy stsenariy",
      hospital: "Shahar tug'ruqxonasi",
      badge: "Misol",
    },
    {
      quote:
        "Oddiy ofis davomat dasturlari tibbiyotning murakkab smenalarini (kun/tun/sutka) tushunmasdi. Bu tizim aynan shifoxonalar protokollariga moslab yaratilgan. 14 kunlik bepul sinovda o'z smenalaringiz bilan sinab ko'rish mumkin.",
      author: "Klinika direktori",
      role: "Namunaviy stsenariy",
      hospital: "Ko'p tarmoqli xususiy klinika",
      badge: "Misol",
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
            Namunaviy stsenariylar &bull; Misol
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tizim klinikada qanday ishlaydi?
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Quyidagilar real mijoz fikri emas — tizimdan foydalanishning namunaviy holatlari
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Namunaviy holat
                  </span>
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
