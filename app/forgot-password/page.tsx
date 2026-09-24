"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Activity, ArrowLeft, KeyRound, Send, MailCheck, Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type UsernameForm = { username: string };
type OtpForm = { code: string; newPassword: string; confirmPassword: string };

type Step = "username" | "sent-generic" | "sent-telegram" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const usernameForm = useForm<UsernameForm>();
  const otpForm = useForm<OtpForm>();
  const newPw = otpForm.watch("newPassword");
  const confirmPw = otpForm.watch("confirmPassword");

  const onSubmitUsername = async (data: UsernameForm) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ username: data.username });
      setUsername(data.username);
      if (res?.channel === "TELEGRAM") {
        setStep("sent-telegram");
      } else {
        setStep("sent-generic");
      }
    } catch {
      // Hisob mavjudligini oshkor qilmaslik uchun har doim generic xabar
      setUsername(data.username);
      setStep("sent-generic");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitOtp = async (data: OtpForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Parollar mos kelmaydi");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyResetOtp({
        username,
        code: data.code,
        newPassword: data.newPassword,
      });
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      setStep("done");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Kod noto'g'ri yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-[#0d0f17] bg-slate-100">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)" }}>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-violet-500/25 blur-[80px] animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-[380px] h-[380px] rounded-full bg-indigo-400/30 blur-[80px] animate-pulse" style={{ animationDelay: "1.4s" }} />
        </div>

        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />

        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        <div className="relative z-10 flex flex-col p-12 xl:p-16 text-white w-full min-h-full">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">StaffPlusPRO</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-5 py-4">
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-sm w-fit shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="text-white/90 font-medium">Xavfsiz tiklash</span>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-[2.8rem] xl:text-[3.2rem] font-extrabold leading-[1.05] tracking-tight">
                Parolni
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #c7d2fe, #a5b4fc)" }}>
                  Tiklash
                </span>
              </h2>
              <p className="text-indigo-200/90 text-[15px] leading-relaxed max-w-[320px]">
                Hisobingizga bog&apos;langan email yoki Telegram orqali xavfsiz tarzda yangi parol o&apos;rnating.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2 rounded-xl bg-indigo-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold dark:text-white text-gray-900">StaffPlusPRO</span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium dark:text-gray-400 text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Kirish sahifasiga qaytish
          </Link>

          <div className="dark:bg-[#141824] bg-white rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30 border dark:border-[#1e2638] border-gray-200">

            {/* ── Step 1: username ── */}
            {step === "username" && (
              <>
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-1">
                    Parolni unutdingizmi?
                  </h1>
                  <p className="dark:text-gray-400 text-gray-500 text-sm">
                    Foydalanuvchi nomingizni kiriting, biz tiklash bo&apos;yicha ko&apos;rsatma yuboramiz
                  </p>
                </div>

                <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                      Foydalanuvchi nomi
                    </label>
                    <input
                      {...usernameForm.register("username", { required: "Login kiritish shart" })}
                      type="text"
                      autoComplete="username"
                      placeholder="username"
                      className={cn(
                        "input-field",
                        usernameForm.formState.errors.username && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {usernameForm.formState.errors.username && (
                      <p className="mt-1 text-xs text-red-400">{usernameForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Yuborilmoqda...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Yuborish
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Step 2a: generic (email or unknown) ── */}
            {step === "sent-generic" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <MailCheck className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                  Ko&apos;rsatma yuborildi
                </h1>
                <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed">
                  Agar hisob mavjud bo&apos;lsa, parolni tiklash bo&apos;yicha ko&apos;rsatma emailingizga yoki Telegramingizga yuborildi. Iltimos, xabarlaringizni tekshiring.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition-colors mt-6"
                >
                  <ArrowLeft className="w-4 h-4" /> Kirish sahifasiga qaytish
                </Link>
              </div>
            )}

            {/* ── Step 2b: telegram OTP + new password ── */}
            {step === "sent-telegram" && (
              <>
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center mb-4">
                    <Send className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-1">
                    Telegramga kod yuborildi
                  </h1>
                  <p className="dark:text-gray-400 text-gray-500 text-sm">
                    Telegram botdan kelgan 6 xonali kodni va yangi parolingizni kiriting
                  </p>
                </div>

                <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                      Tasdiqlash kodi
                    </label>
                    <input
                      {...otpForm.register("code", { required: "Kod kiritish shart", minLength: 6, maxLength: 6 })}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className={cn(
                        "input-field text-center tracking-[0.5em] font-bold text-lg",
                        otpForm.formState.errors.code && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {otpForm.formState.errors.code && (
                      <p className="mt-1 text-xs text-red-400">Kod 6 ta raqamdan iborat bo&apos;lishi kerak</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                      Yangi parol
                    </label>
                    <div className="relative">
                      <input
                        {...otpForm.register("newPassword", { required: "Parol kiritish shart", minLength: { value: 6, message: "Kamida 6 ta belgi" } })}
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={cn(
                          "input-field pr-10",
                          otpForm.formState.errors.newPassword && "border-red-500 focus:ring-red-500"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:dark:text-gray-300 hover:text-gray-600 transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {otpForm.formState.errors.newPassword && (
                      <p className="mt-1 text-xs text-red-400">{otpForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                      Yangi parolni tasdiqlang
                    </label>
                    <input
                      {...otpForm.register("confirmPassword", { required: "Tasdiqlash shart" })}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={cn(
                        "input-field",
                        confirmPw && newPw !== confirmPw && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {confirmPw && newPw !== confirmPw && (
                      <p className="mt-1 text-xs text-red-400">Parollar mos kelmaydi</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Tekshirilmoqda...
                      </span>
                    ) : (
                      "Parolni o'rnatish"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("username")}
                    className="w-full text-center text-xs font-medium dark:text-gray-500 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  >
                    Boshqa login bilan urinib ko&apos;rish
                  </button>
                </form>
              </>
            )}

            {/* ── Step 3: done ── */}
            {step === "done" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                  Parol muvaffaqiyatli o&apos;zgartirildi!
                </h1>
                <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed mb-6">
                  Endi yangi parolingiz bilan tizimga kirishingiz mumkin.
                </p>
                <Link href="/login" className="btn-primary w-full py-3 text-base inline-flex items-center justify-center">
                  Kirish sahifasiga o&apos;tish
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
