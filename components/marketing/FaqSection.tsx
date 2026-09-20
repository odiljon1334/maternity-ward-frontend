"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";

interface FaqSectionProps {
  onOpenTrial: () => void;
}

export function FaqSection({ onOpenTrial }: FaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Har bir korxona o'z logosi va nomini qo'ya oladimi (White-Label)?",
      a: "Albatta! StaffPlusPRO har bir korxonaga o'z brendi ostida ishlash imkonini beradi. Siz o'z logotipingiz va korxona nomingizni yuklaysiz. Xodimlarning shaxsiy kabinetida, boshqaruv panelida va Telegram botida aynan sizning brendingiz chiqadi. Tug'ruqxona va klinikalar uchun esa maxsus 'MaternityCare' tibbiy moduli avtomatik faollashadi.",
    },
    {
      q: "Face ID terminal o'rnatish majburiymi va xizmat shartlari qanday?",
      a: "Face ID terminal o'rnatish majburiy emas: xodimlar smartfon ilovasi orqali GPS geolokatsiya va selfie yuz tasdiqlash bilan bemalol davomatdan o'tishlari mumkin. Agar ko'p xodimli korxona bo'lib alohida Face ID apparati o'rnatib berish so'ralsa — korxona faqat apparat va kabel tannarxini to'laydi. Mutaxassislarimiz tomonidan o'rnatish, montaj va dasturiy sozlash ishlari dastur obunasi tarkibida qo'shimcha xizmat to'lovisiz amalga oshiriladi.",
    },
    {
      q: "Qanday biometrik terminallar qo'llab-quvvatlanadi?",
      a: "Tizim universal ochiq arxitekturaga ega bo'lib, Hikvision, Dahua, ZKTeco, Uniview va boshqa xalqaro IP biometriya terminallari bilan to'liq ishlaydi. Shuningdek, ofisdan tashqaridagi xodimlar uchun smartfondagi GPS geolokatsiya va mobil self-checkin imkoniyati mavjud. Agar sizda mavjud qurilmalar bo'lsa, ularni tezda ulab bera olamiz.",
    },
    {
      q: "14 kunlik sinov davrida qanday imkoniyatlar beriladi?",
      a: "14 kunlik sinov davrida barcha funksiyalar (White-Label brending, Face ID integratsiyasi, 24/7 smena jadvallari, Telegram bildirishnomalari, avtomatlashtirilgan T-13 tabel) to'liq va cheklovlarsiz taqdim etiladi. Bank kartasi talab qilinmaydi.",
    },
    {
      q: "Kasalxonada yoki zavodda internet uzilsa davomat to'xtab qoladimi?",
      a: "Yo'q, aslo to'xtamaydi. Terminallar ichki xotirasida 50 000 tagacha hodisani oflayn rejimda saqlaydi. Internet qayta ulanishi bilan barcha davomat yozuvlari milliy bulutimizga soniyasigacha sinxronlanadi.",
    },
    {
      q: "Tibbiyot va tungi smena ustamalari qanday hisoblanadi?",
      a: "MaternityCare moduli doirasida shifokor va hamshiralarning 24/7 navbatchiliklari (kunduzgi, tungi, 24 soatlik sutkalik) avtomatik hisoblanadi. O'zbekiston Mehnat Kodeksiga muvofiq tungi soatlarga 1.5x, bayram kunlariga 2x ustamalar qo'shiladi va 1C / Excel formatiga eksport qilinadi.",
    },
    {
      q: "Narxlar qanday to'lanadi va hisob-faktura taqdim etiladimi?",
      a: "Xodim soniga qarab bosqichli hisoblanadi: 1–14 xodim — oyiga FIKS 599 000 so'm (chegirma); 15–199 xodim — 15 000 so'm/xodim/oy; 200–500 xodim — 12 000 so'm/xodim/oy; 500+ xodim — individual kelishuv. Yillik to'lovda 2 oy BEPUL. To'lovni Click, Payme yoki davlat hamda xususiy tashkilotlar uchun Didox elektron hisob-fakturasi (shartnoma) orqali amalga oshirish mumkin.",
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ko&apos;p Beriladigan Savollar</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savollaringiz bormi? Javob beramiz
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Rahbarlar va kadrlar bo&apos;limi tomonidan eng ko&apos;p beriladigan savollar
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA banner inside FAQ */}
        <div className="mt-14 p-8 rounded-3xl bg-blue-600 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-600/20">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Boshqa savollaringiz bormi?</h3>
            <p className="text-xs sm:text-sm text-blue-100">
              Mutaxassislarimiz korxona talablaringiz bo&apos;yicha bepul maslahat beradi va tizimni namoyish qiladi.
            </p>
          </div>
          <button
            onClick={onOpenTrial}
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>14 kunlik bepul sinov</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
