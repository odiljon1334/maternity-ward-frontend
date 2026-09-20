"use client";

import { useState } from "react";
import {
  X,
  Play,
  Pause,
  Video,
  UserPlus,
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  Cpu,
  CheckCircle2,
  Clock,
  Download,
  ChevronRight,
  Maximize2,
  Volume2,
  VolumeX,
  Info,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export interface VideoTutorialItem {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  duration: string;
  icon: any;
  badge: string;
  steps: string[];
  keyNotes: string[];
  downloadAction?: {
    label: string;
    filename: string;
    type: "excel" | "pdf";
  };
  mockVideoSteps: {
    time: string;
    label: string;
    detail: string;
  }[];
}

export const TUTORIAL_LESSONS: VideoTutorialItem[] = [
  {
    id: "add-employee-faceid",
    number: "01",
    title: "Xodim qo'shish va fotosurat (Face ID) yuklash",
    shortDesc: "Yangi xodim ma'lumotlarini kiritish, yuz rasmini to'g'ri yuklash talablari va Face ID apparatiga avtomatik sinxronizatsiya qilish.",
    duration: "03:45",
    icon: UserPlus,
    badge: "Boshlang'ich qadam",
    steps: [
      "Chap menyudagi 'Xodimlar' bo'limiga o'ting va yuqoridagi '+ Yangi xodim' tugmasini bosing.",
      "Xodimning F.I.SH, PINFL, telefon raqami, bo'limi (masalan: Jarrohlik, Ma'muriyat, Ishlab chiqarish) va lavozimini kiriting.",
      "Face ID bo'limida xodim fotosuratini yuklang yoki veb-kamera orqali to'g'ridan-to'g'ri suratga oling.",
      "Muhim: Rasm tiniq, yorug' joyda, ko'zoynaksiz va yuz to'g'riga qaragan holatda bo'lishi lozim (Smart AI tekshiruvdan o'tadi).",
      "'Saqlash' tugmasini bosing — xodim yuz biometriyasi tarmoqdagi barcha Face ID terminallariga 3 soniya ichida avtomatik yuboriladi.",
    ],
    keyNotes: [
      "Ko'zoynak, qora niqob yoki qorong'i fonda olingan rasmlarni yuklamang.",
      "Agar xodimlar ko'p bo'lsa, Excel shabloni orqali 500 tagacha xodimni birdaniga yuklash mumkin.",
    ],
    downloadAction: {
      label: "Xodimlarni ommaviy yuklash uchun Excel shablon",
      filename: "Xodimlar_import_shablon_StaffPlusPRO.xlsx",
      type: "excel",
    },
    mockVideoSteps: [
      { time: "00:15", label: "Xodimlar bo'limiga kirish", detail: "Boshqaruv panelidagi 'Xodimlar' moduli ochiladi" },
      { time: "01:10", label: "Shaxsiy ma'lumotlarni to'ldirish", detail: "F.I.SH, PINFL, telefon va lavozim kiritiladi" },
      { time: "02:05", label: "Face ID rasmini yuklash", detail: "Yuz biometriyasi sifati tekshiriladi" },
      { time: "03:20", label: "Terminalga sinxronizatsiya", detail: "Yuz ma'lumotlari qurilmaga avtomatik jo'natiladi" },
    ],
  },
  {
    id: "custom-schedules",
    number: "02",
    title: "Har bir kun uchun har xil vaqtdagi smena va grafik yaratish",
    shortDesc: "Haftaning har bir kuni (Dush-Yaksh) uchun alohida kirish-chiqish vaqtlari, tushlik tanaffusi, tungi smena va 24h navbatchiliklar tuzish.",
    duration: "05:12",
    icon: CalendarDays,
    badge: "Moslashuvchan jadval",
    steps: [
      "Menyudan 'Smenalar & Ish grafigi' (Schedules) sahifasini oching.",
      "Yangi grafik yaratishda 'Kunbay moslashuvchan rejim'ni (Custom Daily Shift) tanlang.",
      "Haftaning har bir kunini alohida sozlang: Masalan, Dushanba: 08:00–17:00, Seshanba: 10:00–19:00, Chorshanba: 20:00–08:00 (tungi), Payshanba: Dam olish kuni.",
      "Tushlik tanaffusini belgilang (masalan: 12:30 dan 13:30 gacha — bu vaqt ish soatidan avtomatik chegiriladi).",
      "Kechikish uchun ruxsat etilgan chegarani (Grace period: 10–15 daqiqa) kiriting.",
      "Tayyor grafikni yakka xodimga yoki bo'limdagi barcha xodimlarga 1 bosishda biriktiring.",
    ],
    keyNotes: [
      "Har bir kun uchun turlicha vaqt belgilash orqali smenada ishlaydigan hamshiralar, usta va sotuvchilar intizomi aniq hisoblanadi.",
      "Tungi smenaga o'tgan soatlar Mehnat Kodeksiga binoan tungi 1.5x tarifida avtomatik ajratiladi.",
    ],
    mockVideoSteps: [
      { time: "00:20", label: "Grafik generatorini ochish", detail: "Kalendar oynasi va smena sozlamalari ko'rinadi" },
      { time: "01:35", label: "Hafta kunlariga vaqt belgilash", detail: "Har bir kun uchun mustaqil soatlar kiritiladi" },
      { time: "03:10", label: "Tushlik va tanaffuslarni sozlash", detail: "Avtomatik hisobdan chiqariladigan tanaffuslar" },
      { time: "04:40", label: "Xodimlarga ommaviy biriktirish", detail: "Bo'lim bo'yicha jadval tasdiqlanadi" },
    ],
  },
  {
    id: "payroll-calculation",
    number: "03",
    title: "Oylik maosh (ish haqi) hisoblash va stavkalar qo'shish",
    shortDesc: "Oklad yoki soatbay stavka belgilash, tungi 1.5x va bayram 2.0x ustamalari, jarimalar va mukofotlarni avtomatik hisoblash.",
    duration: "04:30",
    icon: DollarSign,
    badge: "Moliya & Kadrlar",
    steps: [
      "Boshqaruv panelida 'Ish haqi & Payroll' bo'limini oching.",
      "Har bir lavozim yoki xodim uchun maosh turini tanlang: oylik belgilangan oklad yoki soatbay (Hourly rate) stavka.",
      "Qo'shimcha koeffitsientlarni tekshiring: Tungi soatlarga 1.5x, bayram va dam olish kunlaridagi ish uchun 2.0x ustama.",
      "Kechikishlar va sababsiz kelmagan kunlar uchun avtomatik jarima qoidalarini belgilang.",
      "Oy yakunida 'Hisoblash' tugmasini bosing — tizim xodimning Face ID orqali ishlagan haqiqiy daqiqalaridan kelib chiqib to'liq vedomost tuzadi.",
    ],
    keyNotes: [
      "Kadrlar va hisobchilar qo'lda kalkulyatorda hisoblashi shart emas — inson omili xatolari bartaraf etiladi.",
      "Hisoblangan ish haqini bonus yoki jarima bilan bevosita jadvalda tahrirlash mumkin.",
    ],
    downloadAction: {
      label: "Ish haqi hisob-kitob vedomosti namunasi (Excel)",
      filename: "Ish_haqi_vedomost_StaffPlusPRO.xlsx",
      type: "excel",
    },
    mockVideoSteps: [
      { time: "00:10", label: "Ish haqi moduli tanishuvi", detail: "Oklad va soatbay stavkalar jadvali" },
      { time: "01:25", label: "1.5x va 2.0x koeffitsientlar", detail: "Tungi va bayram ustamalarini sozlash" },
      { time: "02:50", label: "Kechikishlar balansini ko'rish", detail: "Daqiqabay ish haqi chegirilishi" },
      { time: "04:00", label: "Yakuniy vedomostni chiqarish", detail: "Xodimlarga to'lanadigan sof summa" },
    ],
  },
  {
    id: "export-excel-pdf",
    number: "04",
    title: "T-13 tabel va hisobotlarni Excel va PDF yuklab olish, tahrirlash",
    shortDesc: "Davlat standarti T-13 davomat tabeli, kechikishlar hisoboti, Excel (.xlsx) da tahrirlash va muhr/imzoli PDF eksport.",
    duration: "03:55",
    icon: FileSpreadsheet,
    badge: "Hisobotlar & 1C",
    steps: [
      "Menyudan 'Hisobotlar' (Reports) yoki 'T-13 Tabel' bo'limiga o'ting.",
      "Hisobot davrini tanlang (joriy oy, o'tgan oy yoki istalgan sana oralig'i).",
      "Bo'lim yoki butun korxona bo'yicha saralashni qo'llang.",
      "Yuqori o'ng burchakdagi 'Excel (.xlsx)' tugmasini bosing — T-13 shaklidagi to'liq jadval kompyuteringizga yuklanadi. Uni Excelda bemalol tahrirlashingiz yoki 1C ga import qilishingiz mumkin.",
      "Agar rahbar imzosi va tashkilot muhri uchun kerak bo'lsa, 'PDF' tugmasini bosing — tayyor A4 formatidagi chiroyli vedomost shakllanadi.",
    ],
    keyNotes: [
      "Excel fayldagi har bir ustun rasmiy O'zbekiston mehnat qoidalariga (T-13 shakli) to'liq mos keladi.",
      "1C:Korxona (8.3) bilan to'g'ridan-to'g'ri integratsiya API si mavjud.",
    ],
    downloadAction: {
      label: "Rasmiy T-13 Davomat Tabeli namunasi (Excel)",
      filename: "T13_Davomat_Tabeli_Namuna.xlsx",
      type: "excel",
    },
    mockVideoSteps: [
      { time: "00:15", label: "Hisobot davrini tanlash", detail: "Oy va bo'limlar bo'yicha filtrlash" },
      { time: "01:20", label: "T-13 tabelini shakllantirish", detail: "Ishlangan kunlar, soatlar va kechikishlar" },
      { time: "02:30", label: "Excel (.xlsx) formatida yuklab olish", detail: "Faylni ochish va ustunlarni tahrirlash" },
      { time: "03:30", label: "PDF formatida chop etish", detail: "Muhr va imzo uchun tayyor format" },
    ],
  },
  {
    id: "terminal-setup",
    number: "05",
    title: "Face ID qurilmasini (1 yoki 2 ta) o'rnatish, ulash va sozlash",
    shortDesc: "Aksariyat korxonalarga 1-2 ta Face ID kifoya. Dasturga to'lov qilinsa — o'rnatib sozlab berishga xizmat haqqi olinmaydi!",
    duration: "06:10",
    icon: Cpu,
    badge: "Uskuna & Montaj",
    steps: [
      "Joylashuvni aniqlash: Kirish eshigi yoki turniketga 1 ta (kirish/chiqish birgalikda) yoki 2 ta (alohida kirish va alohida chiqish) Face ID apparati o'rnatiladi.",
      "Tarmoqqa ulash: Qurilma LAN kabeli (Ethernet) yoki Wi-Fi orqali mahalliy internet tarmog'iga ulanadi.",
      "Dasturga to'lov qilingan holda: Bizning servis muhandislarimiz joyiga chiqib qurilmani devorga montaj qiladi, turniket relesiga ulaydi va serverga sozlab beradi — buning uchun XIZMAT HAQQI OLINMAYDI (0 so'm)!",
      "Mavjud apparatlar: Agar sizda avvaldan Hikvision, Dahua yoki ZKTeco qurilmalari bo'lsa, ularning IP manzilini kiritib 15 daqiqada StaffPlusPRO tizimiga bepul ulab beramiz.",
      "Test qilish: Xodim yuzini ko'rsatishi bilan 0.3 soniyada eshik ochiladi va davomat real vaqt rejimida dasturga tushadi.",
    ],
    keyNotes: [
      "Eslatma: 'Uskunalarni to'liq bepul tarqatamiz' degan aldov yo'q. Qurilmani o'zingiz xarid qilasiz yoki bizdan qulay narxda olasiz, lekin O'RNATISH VA SOZLASH XIZMATI UCHUN BIZ HAQ OLMAYMIZ!",
      "1 ta Face ID terminali kuniga 300–500 tagacha xodim o'tishini bemalol qamrab oladi.",
    ],
    downloadAction: {
      label: "Face ID terminalini sozlash bo'yicha to'liq qo'llanma (PDF)",
      filename: "FaceID_Terminal_Sozlash_Qollanma_StaffPlusPRO.pdf",
      type: "pdf",
    },
    mockVideoSteps: [
      { time: "00:25", label: "Terminal joyini tanlash", detail: "Turniket va eshik yoniga to'g'ri o'rnatish balandligi" },
      { time: "01:50", label: "Kabel va internet ulanishi", detail: "Ethernet LAN va statik IP sozlash" },
      { time: "03:40", label: "StaffPlusPRO bulutiga ulash", detail: "Qurilma API kaliti va sinxronizatsiya" },
      { time: "05:15", label: "Test o'tish va eshik ochilishi", detail: "0.3 soniyada davomat qayd etilishi" },
    ],
  },
];

interface VideoTutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLessonId?: string;
}

export function VideoTutorialsModal({
  isOpen,
  onClose,
  defaultLessonId,
}: VideoTutorialsModalProps) {
  const [activeLessonId, setActiveLessonId] = useState<string>(
    defaultLessonId || TUTORIAL_LESSONS[0].id
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(35);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  if (!isOpen) return null;

  const currentLesson =
    TUTORIAL_LESSONS.find((l) => l.id === activeLessonId) || TUTORIAL_LESSONS[0];

  const handleDownload = (action: VideoTutorialItem["downloadAction"]) => {
    if (!action) return;
    toast.success(`Yuklab olinmoqda: ${action.filename}`, {
      description: "Fayl muvaffaqiyatli saqlandi va foydalanishga tayyor.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  StaffPlusPRO Video Qo&apos;llanmalar &amp; Yo&apos;riqnomalar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  5 ta Asosiy Dars
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tizimdan professional foydalanish, xodimlar, grafiklar, oylik maosh va Face ID sozlash
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Player & Right Lesson List */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Video Player & Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Simulated Interactive Video Screen */}
            <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between p-4 group">
              {/* Top Video Overlay Bar */}
              <div className="flex items-center justify-between z-10 text-xs">
                <span className="px-3 py-1 rounded-full bg-blue-600/90 text-white font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Dars #{currentLesson.number} &bull; {currentLesson.badge}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/60 text-slate-300 font-mono text-[11px] backdrop-blur-xs">
                  {currentLesson.duration}
                </span>
              </div>

              {/* Center Screen Interactive Visualizer */}
              <div className="my-auto text-center space-y-3 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 backdrop-blur-md shadow-2xl">
                  {currentLesson.icon && <currentLesson.icon className="w-8 h-8 sm:w-10 sm:h-10" />}
                </div>

                <div className="space-y-1">
                  <h4 className="text-white text-base sm:text-lg font-bold">
                    {currentLesson.title}
                  </h4>
                  <p className="text-slate-400 text-xs max-w-md mx-auto line-clamp-2">
                    {currentLesson.shortDesc}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isPlaying ? "Videoni to'xtatish" : "Videoni davom ettirish"}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="space-y-2 z-10 bg-slate-950/80 -mx-4 -mb-4 p-3 border-t border-slate-800/80 backdrop-blur-md">
                {/* Progress bar */}
                <div
                  className="w-full h-1.5 rounded-full bg-slate-800 cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = ((e.clientX - rect.left) / rect.width) * 100;
                    setCurrentProgress(Math.min(100, Math.max(0, pos)));
                  }}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-[11px]">
                      01:15 / {currentLesson.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : 1)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] cursor-pointer"
                    >
                      {playbackSpeed}x
                    </button>
                    <button
                      onClick={() => toast.info("To'liq ekran rejimi faollashdi")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Timeline / Chapters */}
            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Video Boblari (Taymlayn)</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {currentLesson.mockVideoSteps.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 hover:border-blue-500 transition-colors cursor-pointer shadow-xs"
                    onClick={() => {
                      setCurrentProgress((idx + 1) * 23);
                      toast.success(`${s.time} ga o'tildi: ${s.label}`);
                    }}
                  >
                    <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/50">
                      {s.time}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-[11px] truncate">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                        {s.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Bosqichma-bosqich amaliy ko&apos;rsatmalar:</span>
              </h4>
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                {currentLesson.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Key Notes Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                Muhim tavsiyalar:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                {currentLesson.keyNotes.map((kn, idx) => (
                  <li key={idx}>{kn}</li>
                ))}
              </ul>
            </div>

            {/* Download Material if exists */}
            {currentLesson.downloadAction && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    {currentLesson.downloadAction.type === "excel" ? (
                      <FileSpreadsheet className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-900 dark:text-white">
                      {currentLesson.downloadAction.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {currentLesson.downloadAction.filename}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(currentLesson.downloadAction)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yuklab olish</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: All 5 Lessons Playlist (5 cols) */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto p-5 sm:p-6 bg-slate-100/60 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Barcha Darslar Ro&apos;yxati
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                Jami 5 ta dars
              </span>
            </div>

            <div className="space-y-2.5">
              {TUTORIAL_LESSONS.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                const IconComp = lesson.icon;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveLessonId(lesson.id);
                      setCurrentProgress(20);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 shadow-xs ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 ring-2 ring-blue-500/50"
                        : "bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isActive
                              ? "bg-white/25 text-white"
                              : "bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          Dars #{lesson.number}
                        </span>
                        <span
                          className={`text-[11px] font-mono ${
                            isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {lesson.duration}
                        </span>
                      </div>

                      <h5
                        className={`text-xs sm:text-sm font-bold leading-tight ${
                          isActive ? "text-white" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {lesson.title}
                      </h5>

                      <p
                        className={`text-[11px] line-clamp-2 leading-relaxed ${
                          isActive ? "text-blue-100" : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {lesson.shortDesc}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                        isActive ? "text-white translate-x-1" : "text-slate-400 dark:text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Bottom Support Box */}
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Jonli Texnik Yordam Mavjud</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Savollaringiz bormi? Telegram orqali mutaxassisimiz bepul bog&apos;lanib ekranni ko&apos;rib sozlab beradi:{" "}
                <a
                  href="https://t.me/staffpluspro_support"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-bold underline"
                >
                  @staffpluspro_support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
