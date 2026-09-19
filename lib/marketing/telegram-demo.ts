// StaffPulse marketing sahifasi — "Jonli Telegram bot simulyatori" bo'limi
// content'i (StaffPulse-Reja.md, 1-to'plam, 4-band). Bu DEMO/STATIK
// ma'lumot — haqiqiy botga ulanmaydi, faqat real bot xabar formatiga
// o'xshatilgan (src/telegram/telegram.service.ts, "Bugungi davomat"
// formatiga asoslangan).

export type TelegramDemoCommand = {
  key: string;
  label: string;
  // \n bilan ajratilgan qatorlar, **matn** — qalin qilib ko'rsatiladi
  response: string;
};

export const TELEGRAM_DEMO_COMMANDS: TelegramDemoCommand[] = [
  {
    key: "today",
    label: "📊 Bugungi hisobot",
    response:
      "📊 **Bugungi davomat**\n" +
      "📅 19-sentabr, juma | 🕐 14:30 holat\n\n" +
      "👥 Jami xodimlar: **42 ta**\n" +
      "✅ Keldi: **38 ta**\n" +
      "❌ Hali kelmagan: **4 ta**\n" +
      "⚠️ Kechikkan: **3 ta**",
  },
  {
    key: "late",
    label: "🚨 Kechikkanlar",
    response:
      "🚨 **Bugun kechikkanlar (3 ta)**\n\n" +
      "1. Aziza Karimova — 14 daqiqa\n" +
      "2. Bekzod Yusupov — 8 daqiqa\n" +
      "3. Malika Tosheva — 22 daqiqa",
  },
  {
    key: "shift",
    label: "📅 Smena jadvalim",
    response:
      "📅 **Sizning smena jadvalingiz**\n\n" +
      "Dushanba – Juma: 09:00–18:00\n" +
      "Shanba: 09:00–14:00\n" +
      "Yakshanba: Dam olish kuni\n\n" +
      "Keyingi navbatchilik: **22-sentabr, seshanba**",
  },
];

export const TELEGRAM_DEMO_WELCOME =
  "Assalomu alaykum! 👋 Men StaffPulse botiman. Quyidagi tugmalardan birini tanlang:";
