"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import {
  BookOpen,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  FileCheck2,
  HandCoins,
  Scale,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const topics = [
  {
    icon: Clock3,
    title: "Ish vaqti va davomat",
    articles: "181, 191, 198 va 200-moddalar",
    text: "Grafik va haqiqiy kelish-ketish vaqti alohida qayd etiladi. Erta kelish kechikish hisoblanmaydi. Overtime ham alohida yuritiladi.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Ish haqi hisob-kitobi",
    articles: "246, 248, 249 va 265-moddalar",
    text: "Bazaviy ish haqi, ishlangan vaqt, kafolatli to‘lovlar va o‘zgaruvchan to‘lovlar alohida ko‘rsatiladi. Ishlanmagan vaqt tuzatmasi jarima emas.",
  },
  {
    icon: Trophy,
    title: "KPI va mukofot",
    articles: "246, 248 va 252-moddalar",
    text: "Oldindan tasdiqlangan KPI mezonlari bo‘yicha bonus va Director qaroridagi bir martalik rag‘bat mukofoti bir-biridan ajratiladi.",
  },
  {
    icon: ShieldCheck,
    title: "Intizomiy choralar",
    articles: "312–314-moddalar",
    text: "Pul jarimasi avtomatik qo‘llanmaydi. Xodimdan tushuntirish olinadi, vakolatli qaror buyruq bilan rasmiylashtiriladi va xodim tanishtiriladi.",
  },
  {
    icon: HandCoins,
    title: "Avans va ushlab qolish",
    articles: "253, 269 va 270-moddalar",
    text: "Avans yakuniy hisob-kitobda alohida ko‘rsatiladi. Jami qonuniy ushlab qolish, odatda, hisoblangan ish haqining 50 foizidan oshmaydi.",
  },
  {
    icon: Scale,
    title: "Qo‘shimcha ish vaqti",
    articles: "189, 190 va 262-moddalar",
    text: "Overtime uchun qonuniy asos va tasdiq kerak. Birinchi ikki soat kamida 1,5 hissa, undan keyingi qism kamida 2 hissa to‘lanadi.",
  },
];

export default function LaborLawPage() {
  const { user } = useAuthStore();
  const isManager = user?.role !== "EMPLOYEE";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17] text-slate-900 dark:text-slate-100">
      <Topbar
        title="Mehnat huquqi"
        subtitle="O‘zbekiston Mehnat kodeksi va ish haqi bo‘yicha qisqa yo‘riqnoma"
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        <section className="card overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold">Amaldagi Mehnat kodeksi</h2>
                <p className="mt-2 text-indigo-100 leading-relaxed">
                  Quyidagi izohlar tushunishni osonlashtiradi. Huquqiy masalada doimo LexUZdagi amaldagi rasmiy matn asos bo‘ladi.
                </p>
              </div>
              <a
                href="https://lex.uz/docs/-6257288"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors"
              >
                Rasmiy kodeks <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <article key={topic.title} className="card p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <topic.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{topic.title}</h3>
                  <p className="text-xs font-semibold text-indigo-500 mt-1">{topic.articles}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-6 mt-3">{topic.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {isManager && (
          <section className="card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold">Rahbar uchun</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6 mt-2">
                  Muassasaning ichki mehnat tartibi, haq to‘lash va KPI nizomi, avans sanalari hamda intizomiy tartibi tasdiqlangan va xodimlarga tanishtirilgan bo‘lishi kerak. Tizimdagi keyingi bosqichda hujjat versiyasi va “tanishdim” tasdig‘i ham audit bilan saqlanadi.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
