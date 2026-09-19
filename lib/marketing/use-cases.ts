// StaffPulse marketing sahifasi — "Sohalar bo'yicha moslashuv" bo'limi
// content'i (StaffPulse-Reja.md, 1-to'plam, 3-band). Sof kontent — backend
// bilan bog'liq emas, FAZA 4 marketing landing sahifasiga integratsiya
// qilinganda shu ma'lumotlardan foydalaniladi.

export type IndustryUseCase = {
  key: string;
  icon: "stethoscope" | "factory" | "laptop" | "store";
  name: string;
  pitch: string;
  features: string[];
};

export const INDUSTRY_USE_CASES: IndustryUseCase[] = [
  {
    key: "clinic",
    icon: "stethoscope",
    name: "Klinika va Tug'ruqxonalar",
    pitch: "24/7 ishlaydigan tibbiyot jamoasi uchun mo'ljallangan",
    features: [
      "24/7 navbatchilik jadvali va tungi smenalar uchun alohida hisob-kitob",
      "Shifokorlar va hamshiralar rotatsiyasini avtomatik rejalashtirish",
      "GPS-tasdiqlangan check-in — faqat bino hududida ishlaydi",
      "Har bir bo'lim (tug'ruqxona, reanimatsiya va h.k.) bo'yicha alohida hisobot",
    ],
  },
  {
    key: "factory",
    icon: "factory",
    name: "Ishlab chiqarish va Zavodlar",
    pitch: "Minglab ishchi, bitta boshqaruv paneli",
    features: [
      "Turniket (Hikvision) orqali kirish-chiqishni avtomatik qayd etish",
      "3 smenali (ertalab / kunduzi / tun) grafikni qo'llab-quvvatlaydi",
      "Minglab xodim oqimini bir zumda, kechikishsiz qayd etadi",
      "Sex/bo'lim bo'yicha alohida davomat va samaradorlik hisoboti",
    ],
  },
  {
    key: "office",
    icon: "laptop",
    name: "Ofis va IT kompaniyalar",
    pitch: "Moslashuvchan jamoalar uchun moslashuvchan tizim",
    features: [
      "Moslashuvchan (flexible) ish soatlarini qo'llab-quvvatlaydi",
      "Gibrid rejim — ofis va masofaviy kunlarni birga hisoblaydi",
      "GPS check-in faqat kerak bo'lgan xodimlar uchun yoqiladi",
      "Bo'lim boshliqlari uchun jamoa davomatini bir ko'rinishda kuzatish",
    ],
  },
  {
    key: "retail",
    icon: "store",
    name: "Restoran va Retail",
    pitch: "Filiallar tarmog'ini bitta joydan boshqaring",
    features: [
      "Filiallar o'rtasida xodimlar almashinuvini qo'llab-quvvatlaydi",
      "Soatbay ish haqi hisoblash imkoniyati",
      "Har bir filial uchun alohida, taqqoslanadigan hisobot",
      "Tez smena almashtirish va bo'sh o'rinlarni to'ldirish",
    ],
  },
];
