"use client";

import {
  ScanFace,
  Wrench,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Sparkles,
  Video,
  Play,
} from "lucide-react";

interface TerminalPolicySectionProps {
  onOpenTutorials?: () => void;
  onOpenTrial?: () => void;
}

export function TerminalPolicySection({ onOpenTutorials, onOpenTrial }: TerminalPolicySectionProps) {
  return (
    <section id="terminals" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
            <Cpu className="w-3.5 h-3.5" />
            <span>Face ID Qurilmalar &amp; O&apos;rnatish Qoidalari</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Asosan 1 yoki 2 ta Face ID qurilma yetarli
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
            <strong>FaceID qurilma qo&apos;yish majburiy emas:</strong> xodimlar smartfon ilovasi orqali bemalol foydalanishi mumkin. Agar ko&apos;p xodimli korxona bo&apos;lib apparat qo&apos;yib berish so&apos;ralsa — <strong>faqat apparat va kabel uchun to&apos;lov qilinadi, o&apos;rnatish va dasturiy sozlash xizmat to&apos;lovisiz (obuna tarkibida) bajariladi!</strong>
          </p>
        </div>

        {/* 2 Core Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">
          {/* Card 1: 1 yoki 2 ta Qurilma & Sozlash Xizmati */}
          <div className="relative rounded-3xl border-2 border-blue-500 bg-gradient-to-b from-blue-50/40 via-white to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 p-8 flex flex-col justify-between shadow-xl shadow-blue-500/10">
            <div className="absolute -top-3.5 left-8 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O&apos;rnatish &amp; Sozlash Xizmati Kiritilgan</span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between pt-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Asosiy Yechim: 1 yoki 2 ta Face ID
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                  <ScanFace className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Dasturga to&apos;lov qilinsa — O&apos;rnatib, sozlab berishga xizmat haqqi olinmaydi
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  Siz dastur obunasini to&apos;lasangiz, muhandislarimiz qurilmani joyiga o&apos;rnatish, turniket yoki eshik qulfiga ulash va dastur bilan sinxronizatsiya qilib sozlab berish uchun <strong>qo&apos;shimcha xizmat haqqi olmaydi</strong>. O&apos;rnatish va dasturiy sozlash to&apos;liq paketga kiritilgan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-3">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                  Qanday afzalliklarga ega bo&apos;lasiz?
                </span>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>FaceID qurilma qo&apos;yish majburiy emas:</strong> Xodimlar smartfoni orqali GPS geolokatsiya va selfie yuz tasdiqlash bilan qo&apos;shimcha apparat xarajatisiz ishlayveradi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Ko&apos;p xodimli korxonalarga:</strong> Apparat so&apos;ralsa — faqat apparat va kabel xarajati to&apos;lanadi, joyiga o&apos;rnatish, montaj va dasturga sozlash xizmati mutaxassislarimiz tomonidan bajariladi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>1000+ xodim bo&apos;lsa:</strong> Barcha Face ID terminallar, montaj va kabel ishlari korporativ shartnomada to&apos;liq qoplanadi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Mavjud qurilmalarni ulash:</strong> Agar sizda allaqachon Hikvision, Dahua yoki ZKTeco qurilmalari bo&apos;lsa, ularni dasturimizga 15 daqiqada ulab beramiz!</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Hikvision &bull; Dahua &bull; ZKTeco &bull; Uniview
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Turniket va Magnit qulflar
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onOpenTrial}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
              >
                <span>Sinovdan o&apos;tish &amp; O&apos;rnatishga buyurtma</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Moslashuvchan Grafik & Har Kunga Alohida Vaqt */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  Moslashuvchan Ish Rejimi
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Har bir kun uchun har xil vaqtdagi smena yaratsa bo&apos;ladi
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Barcha xodimlarni bir xil 09:00–18:00 ga majburlash shart emas. Haftaning har bir kuni (Dushanbadan Yakshangagacha) uchun alohida kirish-chiqish soatlarini belgilash mumkin.
                </p>
              </div>

              {/* Day-by-Day Schedule Visual Pill */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Namuna: Har xil kunlik smenalar
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold">DUSHANBA</span>
                    <span className="font-bold text-blue-600">08:00 – 17:00</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold">SESHANBA</span>
                    <span className="font-bold text-indigo-600">10:00 – 19:00</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold">CHORSHANBA</span>
                    <span className="font-bold text-purple-600">20:00 – 08:00 🌙</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[9px] font-bold">YAKSHANBA</span>
                    <span className="font-bold text-emerald-600">24h Navbatchi</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Xodimlarga alohida-alohida individual vaqt jadvali</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tushlik tanaffusi va kechikish chegarasini (Grace period) sozlash</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>T-13 tabelda daqiqasigacha to&apos;g&apos;ri hisoblanish kafolati</span>
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
              {onOpenTutorials ? (
                <button
                  type="button"
                  onClick={onOpenTutorials}
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Grafik yaratish bo&apos;yicha Video Qo&apos;llanmani ko&apos;rish</span>
                </button>
              ) : (
                <a
                  href="/video-qollanma"
                  className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Grafik yaratish bo&apos;yicha Video Qo&apos;llanmani ko&apos;rish</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Video Tutorial CTA Strip */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
              <Play className="w-6 h-6 fill-blue-400 text-blue-400" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold">
                Dasturdan foydalanish bo&apos;yicha to&apos;liq Video Qo&apos;llanmalar mavjud!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Xodim qo&apos;shish, Face ID rasm yuklash, har kunga alohida grafik yaratish, oylik maosh hisoblash va Excel / PDF yuklab olish bo&apos;yicha bosqichma-bosqich o&apos;rganing.
              </p>
            </div>
          </div>
          {onOpenTutorials ? (
            <button
              onClick={onOpenTutorials}
              className="shrink-0 px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>Video Qo&apos;llanmalarni ko&apos;rish</span>
            </button>
          ) : (
            <a
              href="/video-qollanma"
              className="shrink-0 px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Video className="w-4 h-4 text-blue-600" />
              <span>Video Qo&apos;llanmalarni ko&apos;rish</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
