import type { Metadata } from "next";
import { LegalDocumentPage, type LegalSection } from "@/components/marketing/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "StaffPlusPRO shaxsiy ma'lumotlar, davomat, biometrik tekshiruv va GPS ma'lumotlaridan qanday foydalanishi haqida.",
};

const sections: LegalSection[] = [
  {
    title: "Siyosat doirasi",
    paragraphs: [
      "Ushbu siyosat StaffPlusPRO boshqaruv paneli, Android ilovasi, mobil veb kabineti va Telegram botidan foydalanishda qayta ishlanadigan ma'lumotlarni tushuntiradi. Xodim ma'lumotlari bo'yicha asosiy qarorlarni uning ish beruvchi muassasasi qabul qiladi; StaffPlusPRO platformani texnik ta'minlaydi.",
    ],
  },
  {
    title: "Qanday ma'lumotlar qayta ishlanadi",
    items: [
      "Hisob ma'lumotlari: ism, login, rol, muassasa, bo'lim va lavozim.",
      "Davomat va ish ma'lumotlari: grafik, check-in/check-out vaqti, ta'til, smena almashish, hisob-kitob yozuvlari.",
      "Biometrik tekshiruv ma'lumotlari: check-in paytidagi selfi yoki terminaldan kelgan identifikator; saqlash tartibini muassasa sozlamalari belgilaydi.",
      "Joylashuv ma'lumotlari: GPS koordinata, aniqlik, qurilma batareyasi va signal vaqti — faqat faol ish smenasi davomida.",
      "Texnik ma'lumotlar: qurilma va ilova versiyasi, xatolik diagnostikasi va xavfsizlik auditi.",
      "Telegram bog'langanda: Telegram foydalanuvchi identifikatori va mavjud username.",
    ],
  },
  {
    title: "Joylashuv va kuzatuv chegarasi",
    paragraphs: [
      "GPS mobil check-in tasdiqlangandan keyin faol ish smenasi davomida yuboriladi. Check-out yoki smena yakunlanganda kuzatuv to'xtatiladi. Android ilovada faol kuzatuv tizim bildirishnomasi orqali ko'rsatiladi. iPhone brauzeri/PWA fon rejimida uzluksiz kuzatuvni kafolatlamaydi.",
    ],
  },
  {
    title: "Foydalanish maqsadlari",
    items: [
      "davomat va ish grafigini yuritish;",
      "geo-hudud va shaxsni tekshirish;",
      "rahbar va xodimga bildirishnoma yuborish;",
      "hisobot, tabel va ish haqi hisobini tayyorlash;",
      "firibgarlik, ruxsatsiz kirish va texnik xatolarni aniqlash.",
    ],
  },
  {
    title: "Saqlash, uzatish va himoya",
    paragraphs: [
      "Ma'lumotlar muassasa bilan tuzilgan shartnoma, ichki siyosat va amaldagi majburiyatlar doirasida saqlanadi. Ma'lumotlar sotilmaydi. Xizmatni ishlatish uchun zarur hosting, monitoring, email, Telegram yoki to'lov provayderlariga faqat zarur hajmda uzatilishi mumkin.",
      "Tenant ma'lumotlari alohida ajratiladi, rollar bo'yicha kirish nazorati, audit yozuvlari va transport shifrlashi qo'llanadi. Hech bir texnik tizim mutlaq xavfsizlikni kafolatlamaydi; hodisa aniqlansa ta'sirni cheklash va mas'ul tomonlarni xabardor qilish choralari ko'riladi.",
    ],
  },
  {
    title: "Foydalanuvchi murojaatlari",
    paragraphs: [
      "Ma'lumotni ko'rish, aniqlashtirish, tuzatish yoki o'chirish masalasida avvalo muassasa administratoriga murojaat qiling. Hisobni o'chirish davomat va qonuniy hisobot yozuvlarini avtomatik yo'q qilmasligi mumkin; bunday yozuvlar vakolatli muassasa qarori bilan ko'rib chiqiladi.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title="Maxfiylik siyosati"
      summary="Qaysi ma'lumotlar olinishi, nima uchun ishlatilishi va ayniqsa ish vaqtidagi GPS kuzatuvi qanday chegaralanishini ochiq bayon qilamiz."
      updatedAt="28-sentabr 2026"
      sections={sections}
    />
  );
}
