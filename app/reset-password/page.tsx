"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Activity, ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const newPw = watch("newPassword");
  const confirmPw = watch("confirmPassword");

  const onSubmit = async (data: FormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Parollar mos kelmaydi");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword });
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      setDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Havola yaroqsiz yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 dark:bg-[#0d0f17] bg-slate-100">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-2 rounded-xl bg-indigo-600">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold dark:text-white text-gray-900">MaternityCare</span>
        </div>

        <div className="dark:bg-[#141824] bg-white rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30 border dark:border-[#1e2638] border-gray-200">

          {!token && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                Havola yaroqsiz
              </h1>
              <p className="dark:text-gray-400 text-gray-500 text-sm leading-relaxed mb-6">
                Tiklash havolasi noto&apos;g&apos;ri yoki eskirgan. Iltimos, qaytadan so&apos;rang.
              </p>
              <Link href="/forgot-password" className="btn-primary w-full py-3 text-base inline-flex items-center justify-center">
                Qaytadan so&apos;rash
              </Link>
            </div>
          )}

          {token && !done && (
            <>
              <div className="mb-7">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-1">
                  Yangi parol o&apos;rnating
                </h1>
                <p className="dark:text-gray-400 text-gray-500 text-sm">
                  Hisobingiz uchun yangi, xavfsiz parol tanlang
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      {...register("newPassword", { required: "Parol kiritish shart", minLength: { value: 6, message: "Kamida 6 ta belgi" } })}
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={cn(
                        "input-field pr-10",
                        errors.newPassword && "border-red-500 focus:ring-red-500"
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
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                    Yangi parolni tasdiqlang
                  </label>
                  <input
                    {...register("confirmPassword", { required: "Tasdiqlash shart" })}
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
                      Saqlanmoqda...
                    </span>
                  ) : (
                    "Parolni saqlash"
                  )}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-xs font-medium dark:text-gray-500 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kirish sahifasiga qaytish
                </Link>
              </form>
            </>
          )}

          {done && (
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
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
