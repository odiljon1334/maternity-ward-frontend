"use client";

import {
  ScanFace,
  CalendarDays,
  DollarSign,
  Send,
  MapPin,
  CheckCircle2,
  Cpu,
  Palette,
} from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      icon: <ScanFace className="w-6 h-6 text-blue-600" />,
      badge: "1 yoki 2 ta yetarli",
      title: "Face ID: O'rnatib Sozlash Xizmati 0 So'm",
      description:
        "Aksariyat korxonalar uchun 1 ta yoki 2 ta Face ID apparati to'liq yetarli. Dasturga to'lov qilingan holda apparatni o'rnatish, montaj qilish va dastur bilan sozlab berishga XIZMAT HAQQI OLINMAYDI!",
      highlights: ["Asosan 1-2 ta qurilma yetarli", "O'rnatib sozlash haqqi 0 so'm", "Hikvision, Dahua, ZKTeco mosligi"],
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-indigo-600" />,
      badge: "Kunbay Moslashuvchan",
      title: "Har bir kun uchun har xil vaqtdagi smena",
      description:
        "Haftaning har bir kuni uchun turlicha ish soatlarini belgilang: masalan Dushanba 08:00–17:00, Seshanba 10:00–19:00, Chorshanba 20:00–08:00 (tungi), 24 soatlik navbatchilik yoki flex jadval.",
      highlights: ["Har kunga alohida soatlar", "Tungi 1.5x ustamalar", "Tushlik va kechikish chegarasi"],
    },
    {
      icon: <Palette className="w-6 h-6 text-teal-600" />,
      badge: "White-Label Ekotizim",
      title: "O'z Korxonangiz Logosi & Nomi",
      description:
        "Tizim korxonangiz brendiga to'liq moslashadi. Xodimlarning shaxsiy kabinetida va Telegram botida aynan sizning logotipingiz hamda korxonangiz nomi ko'rinadi.",
      highlights: ["Shaxsiy logotip va ranglar", "Korxona nomidagi Telegram bot", "Brendlangan T-13 hisobotlar"],
    },
    {
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      badge: "Moliya & Kadrlar",
      title: "Oylik Maosh & Excel/PDF Tabel",
      description:
        "T-13 tabeli daqiqasigacha to'ldiriladi. Oklad yoki soatbay stavka, tungi soatlar (1.5x), bayram kunlari koeffitsientlari inobatga olinib, Excel (.xlsx) da tahrirlanadi va PDF da chop etiladi.",
      highlights: ["T-13 davomat tabeli", "Excel va PDF yuklab olish", "1C:Korxona bilan integratsiya"],
    },
    {
      icon: <Send className="w-6 h-6 text-sky-600" />,
      badge: "Tezkor nazorat",
      title: "Rahbariyat Telegram Boti",
      description:
        "Har kuni soat 08:30 da rahbar yoki bo'lim boshliqlarining guruhiga ertalabki xulosa boradi: kim vaqtida keldi, kim kechikdi va kim kelmadi.",
      highlights: ["Ertalabki xabarnoma", "Shaxsiy xodim ogohlantirishi", "Rahbariyat guruhiga hisobot"],
    },
    {
      icon: <MapPin className="w-6 h-6 text-rose-600" />,
      badge: "Mobil check-in",
      title: "GPS Geolocation & Mobil Kabinet",
      description:
        "Tashqi savdo vakillari, haydovchilar, feldsherlar va filiallar uchun smartfon orqali self-checkin. Belgilangan geo-radius va yuzni selfi orqali tasdiqlash.",
      highlights: ["Geo-fencing chegarasi", "Selfie bilan tekshirish", "iOS va Android PWA ilova"],
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            Har Bir Soha Ehtiyojiga Moslashgan
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Klinikalar, zavodlar va korxonalar uchun to&apos;liq ekotizim
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Oddiy cheklangan dasturlar murakkab smenalarni hisoblay olmaydi. StaffPlusPRO har bir sohaning o&apos;ziga xos mehnat qoidalariga moslashadi.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/80 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-900 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                {item.highlights.map((hl, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Hardware Agnostic Spotlight Banner */}
        <div id="terminals-spotlight" className="mt-16 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Apparatdan Mustaqillik &bull; Har qanday brend</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sizda allaqachon biometrik terminallar bormi?
            </h3>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Yangi apparat sotib olishingiz shart emas! <strong>Hikvision, Dahua, ZKTeco, Uniview</strong> va boshqa barcha standart IP Face ID terminallarini 15 daqiqada serverimizga ulab beramiz.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Statik IP shart emas
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Mavjud apparatlarni bepul ulash
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                1000+ xodimga terminallar BIZDAN BEPUL
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
