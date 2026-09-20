"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Building2,
  User,
  Phone,
  MapPin,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";
import { getStoredUtmParams, trackMarketingEvent } from "@/lib/tracking";
import { leadsApi } from "@/lib/api";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: "start" | "biznes" | "korporativ";
  defaultStaffCount?: number;
  isAnnual?: boolean;
}

const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Buxoro viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi",
];

export function OnboardingModal({
  isOpen,
  onClose,
  defaultPlan = "biznes",
  defaultStaffCount = 25,
  isAnnual = true,
}: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<"click" | "payme" | "bank">("click");

  const [formData, setFormData] = useState({
    hospitalName: "",
    orgType: "clinic", // clinic, factory, office, retail, edu
    directorName: "",
    phone: "+998 ",
    region: "Toshkent shahri",
    staffCount: defaultStaffCount,
    plan: defaultPlan,
    billingCycle: isAnnual ? "annual" : "monthly",
  });

  if (!isOpen) return null;

  // Price calculations
  const perEmployeeRate = formData.billingCycle === "annual" ? 100000 : 12000;
  const calculatedTotal = formData.staffCount * perEmployeeRate;

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hospitalName.trim()) {
      toast.error("Iltimos, korxona yoki klinika nomini kiriting");
      return;
    }
    if (!formData.directorName.trim()) {
      toast.error("Iltimos, rahbar F.I.Sh. kiriting");
      return;
    }
    if (formData.phone.length < 13) {
      toast.error("Iltimos, to'liq telefon raqamingizni kiriting");
      return;
    }

    setLoading(true);
    const utm = getStoredUtmParams();
    trackMarketingEvent("Lead_Submitted", {
      hospitalName: formData.hospitalName,
      staffCount: formData.staffCount,
      plan: formData.plan,
      billingCycle: formData.billingCycle,
    });

    try {
      await leadsApi.trialRequest({
        hospitalName: formData.hospitalName.trim(),
        orgType: formData.orgType,
        directorName: formData.directorName.trim(),
        phone: formData.phone.trim(),
        region: formData.region,
        staffCount: formData.staffCount,
        plan: formData.plan,
        billingCycle: formData.billingCycle,
        utmSource: utm?.utm_source,
        utmMedium: utm?.utm_medium,
        utmCampaign: utm?.utm_campaign,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      });
      setStep(2);
      toast.success("So'rovingiz qabul qilindi!");
    } catch {
      toast.error("So'rovni yuborishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring yoki Telegram orqali bog'laning.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTrial = () => {
    trackMarketingEvent("Trial_Started", {
      ...formData,
      utm: getStoredUtmParams(),
    });
    toast.success("Xush kelibsiz! Tizimga yo'naltirilmoqda...");
    onClose();
    router.push("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {step === 1 ? "14 kunlik sinovni boshlash" : "Muassasangiz muvaffaqiyatli ulandi"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? "Karta talab qilinmaydi • Barcha funksiyalar to'liq ochiq"
                  : "Sinov davri muvaffaqiyatli faollashtirildi"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {step === 1 ? (
            <form onSubmit={handleSubmitStep1} className="space-y-4">
              {/* Trust Badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>14 kunlik sinov:</strong> O&apos;z logotipingiz, Face ID sinxronizatsiyasi, smena jadvallari va Telegram bot to&apos;liq faollashadi.
                </span>
              </div>

              {/* Organization Type Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faoliyat Sohasi / Korxona turi *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                  {[
                    { id: "clinic", label: "🏥 Klinika", desc: "MaternityCare" },
                    { id: "factory", label: "🏭 Zavod", desc: "Sanoat" },
                    { id: "office", label: "🏢 Ofis/IT", desc: "Biznes" },
                    { id: "retail", label: "🛒 Savdo", desc: "Do'kon" },
                    { id: "edu", label: "🎓 Ta'lim", desc: "Maktab" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, orgType: t.id })}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.orgType === t.id
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-500"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="block font-semibold text-[11px]">{t.label}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospital / Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Korxona yoki Muassasa nomi *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 3-son Tug'ruq Majmuasi, 14-son Oila Poliklinikasi, Medion..."
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Director Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bosh shifokor / Rahbar F.I.Sh. *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Dr. Qosimov Alisher"
                      value={formData.directorName}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon raqam *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+998 90 123 45 67"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Region & Staff count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hudud (Viloyat)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Taxminiy xodimlar soni
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      value={formData.staffCount}
                      onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) || 1 })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Terminal installation notice */}
              {formData.staffCount >= 1000 ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs">
                  🎉 <strong>1000+ xodim (Enterprise):</strong> Face ID terminallari, montaj va kabel ishlari to&apos;liq BIZNING HISOBIMIZDAN bepul amalga oshiriladi!
                </div>
              ) : formData.staffCount >= 15 && formData.staffCount <= 100 ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                  ℹ️ <strong>15–100 xodim:</strong> Terminal o&apos;rnatish va apparat ta&apos;minoti o&apos;zingizdan (dasturiy integratsiya va sozlash bizdan bepul).
                </div>
              ) : null}

              {/* Plan Picker summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span>Tanlangan reja:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    {formData.plan} ({formData.staffCount} xodim)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    14 kundan keyin ({formData.billingCycle === "annual" ? "Yillik" : "Oylik"} to&apos;lov):
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white" suppressHydrationWarning>
                    {formatNumber(calculatedTotal)} so&apos;m
                    <span className="text-xs font-normal text-slate-500">
                      /{formData.billingCycle === "annual" ? "yil" : "oy"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Klinika kabineti tayyorlanmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    14 kunlik bepul sinovni boshlash
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Tugmani bosish orqali siz xizmat ko&apos;rsatish shartlariga va shaxsiy ma&apos;lumotlarni qayta ishlashga rozilik bildirasiz.
              </p>
            </form>
          ) : (
            /* Step 2: Instant Activation & Payment Gateway options */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">
                  &ldquo;{formData.hospitalName}&rdquo; uchun sinov rejimi ochildi!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Sinov muddati: 14 kun (Bugundan boshlab). Barcha terminallar va funksiyalar 100% cheklovlarsiz ishlaydi.
                </p>
              </div>

              {/* Payment Gateway Preview (Self-serve checkout) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    To&apos;lov shlyuzi (Ixtiyoriy — sinovdan so&apos;ng yoki darhol rasmiylashtirish):
                  </h5>
                  <span className="text-xs text-slate-500" suppressHydrationWarning>
                    Summa: {formatNumber(calculatedTotal)} so&apos;m
                  </span>
                </div>

                {/* Methods */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePaymentMethod("click")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      activePaymentMethod === "click"
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-black tracking-wide text-[#0073ff]">CLICK</span>
                    <span className="text-[10px] text-slate-500">Avto-to&apos;lov</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePaymentMethod("payme")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      activePaymentMethod === "payme"
                        ? "border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-black tracking-wide text-[#00c99a]">Payme</span>
                    <span className="text-[10px] text-slate-500">Ilova orqali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePaymentMethod("bank")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      activePaymentMethod === "bank"
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Hisob-raqam</span>
                    <span className="text-[10px] text-slate-500">Shartnoma / 1C</span>
                  </button>
                </div>

                {/* Gateway Detail info */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  {activePaymentMethod === "click" && (
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between font-medium text-slate-900 dark:text-white">
                        <span>Click Merchant ID:</span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          24890-CLINICUK
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Click orqali to&apos;lov darhol bazada yangilanadi va chek yuboriladi. Sinov tugashiga 3 kun qolganda to&apos;lash kifoya.
                      </p>
                    </div>
                  )}

                  {activePaymentMethod === "payme" && (
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between font-medium text-slate-900 dark:text-white">
                        <span>Payme ID:</span>
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          payme://clinicuk24/pay
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Payme orqali korporativ karta yoki Uzcard/Humo orqali 1 daqiqada to&apos;lash mumkin.
                      </p>
                    </div>
                  )}

                  {activePaymentMethod === "bank" && (
                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-900 dark:text-white">
                        Yuridik shaxslar uchun to&apos;lov rekvizitlari:
                      </p>
                      <div className="font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <p>H/r: 2020 8000 9005 1234 5001</p>
                        <p>Bank: AT &ldquo;Ipak Yo&apos;li Banki&rdquo; Chilonzor filiali</p>
                        <p>MFO: 00444 • STIR: 309 876 543</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinishTrial}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Boshqaruv paneliga kirish
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="https://t.me/clinicuk_support"
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4 text-blue-500" />
                  Menejer bilan Telegram
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
