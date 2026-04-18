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
      <div className="hidden lg:flex w-[55%] relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)" }}>

        {/* Layered glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-violet-500/25 blur-[80px] animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-[380px] h-[380px] rounded-full bg-indigo-400/30 blur-[80px] animate-pulse" style={{ animationDelay: "1.4s" }} />
          <div className="absolute top-1/3 right-1/4 w-[260px] h-[260px] rounded-full bg-purple-400/15 blur-[60px] animate-pulse" style={{ animationDelay: "2.5s" }} />
        </div>

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />

        {/* Diagonal accent line */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col p-12 xl:p-16 text-white w-full min-h-full">

          {/* ── Logo — top ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/25 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MaternityCare</span>
          </div>

          {/* ── Main content — center (flex-1 so it fills space) ── */}
          <div className="flex-1 flex flex-col justify-center gap-5 py-4">

            {/* Status badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 text-sm w-fit shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-white/90 font-medium">Xodimlar boshqaruv tizimi</span>
            </div>

            {/* Heading */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[3.2rem] xl:text-[3.6rem] font-extrabold leading-[1.05] tracking-tight">
                Aqlli
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #c7d2fe, #a5b4fc)" }}>
                  Boshqaruv
                </span>
                <br />
                Tizimi
              </h2>
              <p className="text-indigo-200/90 text-[15px] leading-relaxed max-w-[320px]">
                Xodimlar davomati, maosh va kasalxona operatsiyalarini bir platformada boshqaring.
              </p>
            </div>

            {/* Feature list */}
            <div className="flex flex-col gap-2">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4 group px-3 py-2.5 rounded-2xl hover:bg-white/10 transition-colors duration-200">
                  <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 group-hover:border-white/30 transition-all duration-200 shadow-sm">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{label}</p>
                    <p className="text-xs text-indigo-300 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats — bottom ── */}
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            {[
              { value: "99%", label: "Davomat aniqligi" },
              { value: "24/7", label: "Monitoring" },
              { value: "5 daq", label: "O'rnatish" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 hover:bg-white/15 transition-colors duration-200"
              >
                <p className="text-2xl font-extrabold text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-indigo-300 mt-1 leading-tight">{s.label}</p>
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
              {process.env.NEXT_PUBLIC_CONTACT_PHONE && (
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm dark:text-gray-300 text-gray-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {process.env.NEXT_PUBLIC_CONTACT_PHONE}
                  </span>
                </a>
              )}
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
