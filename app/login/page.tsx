"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Activity, Users, Clock, TrendingUp, Shield, Mail, Phone, Send } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

type FormData = {
  username: string;
  password: string;
};

const features = [
  { icon: Users, label: "Xodimlar boshqaruvi", desc: "Barcha bo'limlar va lavozimlar" },
  { icon: Clock, label: "Real-vaqt davomat", desc: "Hikvision integratsiyasi" },
  { icon: TrendingUp, label: "Maosh hisoblash", desc: "Avtomatik oylik hisob" },
  { icon: Shield, label: "Xavfsiz tizim", desc: "Rol asosida kirish nazorati" },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.accessToken, res.user);
      localStorage.setItem("access_token", res.accessToken);
      toast.success("Xush kelibsiz!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-[#0d0f17] bg-slate-100">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-violet-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        {/* Grid dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 text-white w-full">
          {/* Logo top-left */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MaternityCare</span>
          </div>

          {/* Center content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Xodimlar boshqaruv tizimi
            </div>

            <h2 className="text-5xl font-bold leading-tight mb-4">
              Aqlli
              <br />
              <span className="text-indigo-200">Boshqaruv</span>
              <br />
              Tizimi
            </h2>
            <p className="text-indigo-100 text-base leading-relaxed max-w-xs mb-12">
              Xodimlar davomati, maosh va kasalxona operatsiyalarini bir platformada boshqaring.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                    <Icon className="w-5 h-5 text-indigo-100" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{label}</p>
                    <p className="text-xs text-indigo-200">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "99%", label: "Davomat aniqligi" },
              { value: "24/7", label: "Monitoring" },
              { value: "5 daq", label: "O'rnatish" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-indigo-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="p-2 rounded-xl bg-indigo-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold dark:text-white text-gray-900">MaternityCare</span>
          </div>

          <div className="dark:bg-[#141824] bg-white rounded-3xl p-8 shadow-xl shadow-black/5 dark:shadow-black/30 border dark:border-[#1e2638] border-gray-200">
            <div className="mb-8">
              <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-1">
                Xush kelibsiz 👋
              </h1>
              <p className="dark:text-gray-400 text-gray-500 text-sm">
                Hisobingizga kiring
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                  Foydalanuvchi nomi
                </label>
                <input
                  {...register("username", { required: "Login kiritish shart" })}
                  type="text"
                  autoComplete="username"
                  placeholder="username"
                  className={cn(
                    "input-field",
                    errors.username && "border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
                  Parol
                </label>
                <div className="relative">
                  <input
                    {...register("password", { required: "Parol kiritish shart" })}
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn(
                      "input-field pr-10",
                      errors.password && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400 hover:dark:text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Kirish...
                  </span>
                ) : (
                  "Kirish"
                )}
              </button>
            </form>
          </div>

          {/* Contact / CTA section */}
          <div className="mt-6 p-5 rounded-2xl dark:bg-[#141824] bg-white border dark:border-[#1e2638] border-gray-200 shadow-sm">
            <p className="text-xs font-semibold dark:text-gray-400 text-gray-600 mb-3">
              Tizimdan foydalanmoqchimisiz?{" "}
              <span className="dark:text-gray-500 text-gray-400 font-normal">Biz bilan bog'laning</span>
            </p>
            <div className="space-y-2.5">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@maternity.uz'}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@maternity.uz'}
                </span>
              </a>
              <a
                href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE || ''}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {process.env.NEXT_PUBLIC_CONTACT_PHONE || ''}
                </span>
              </a>
              <a
                href="https://t.me/educampus1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 transition-colors">
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  @educampus1
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
