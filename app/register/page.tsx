"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Activity, UserPlus, ShieldCheck, Eye as EyeIcon } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

type Role = "ASSISTANT_ADMIN" | "MINISTRY";

type FormData = {
  username:        string;
  password:        string;
  confirmPassword: string;
  role:            Role;
};

const ROLE_CONFIG: Record<Role, {
  label:       string;
  description: string;
  icon:        React.ReactNode;
  color:       string;
  permissions: Array<{ label: string; ok: boolean }>;
}> = {
  ASSISTANT_ADMIN: {
    label:       "Yordamchi Admin",
    description: "Tizimni boshqarish uchun keng huquqlar",
    icon:        <ShieldCheck className="w-5 h-5" />,
    color:       "indigo",
    permissions: [
      { label: "Kasalxonalarni boshqarish",    ok: true  },
      { label: "Xodimlarni boshqarish",        ok: true  },
      { label: "Grafik va davomatni ko'rish",  ok: true  },
      { label: "To'lov qo'shish",              ok: true  },
      { label: "Bildirishnomalar yuborish",    ok: true  },
      { label: "To'lovni tahrirlash / o'chirish", ok: false },
    ],
  },
  MINISTRY: {
    label:       "Vazirlik Kuzatuvchisi",
    description: "Faqat ko'rish — hech narsa o'zgartira olmaydi",
    icon:        <EyeIcon className="w-5 h-5" />,
    color:       "violet",
    permissions: [
      { label: "Barcha kasalxonalar statistikasi", ok: true  },
      { label: "Davomat hisobotlari",              ok: true  },
      { label: "Maosh xulosasi",                   ok: true  },
      { label: "Kelmagan xodimlar ro'yxati",       ok: true  },
      { label: "Ma'lumot o'zgartirish",            ok: false },
      { label: "Xodim / kasalxona qo'shish",       ok: false },
    ],
  },
};

export default function RegisterPage() {
  const router  = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { role: "ASSISTANT_ADMIN" } });

  const selectedRole = watch("role");
  const config       = ROLE_CONFIG[selectedRole];

  useEffect(() => {
    const check = () => {
      const { token, user } = useAuthStore.getState();
      if (!token || user?.role !== "SUPER_ADMIN") {
        router.replace("/login");
      } else {
        setReady(true);
      }
    };

    const persist = (useAuthStore as any).persist;
    if (persist?.hasHydrated?.()) {
      check();
    } else {
      const unsub  = persist?.onFinishHydration?.(check);
      const timer  = setTimeout(check, 100);
      return () => { unsub?.(); clearTimeout(timer); };
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register({ username: data.username, password: data.password, role: data.role });
      toast.success(`"${data.username}" (${ROLE_CONFIG[data.role].label}) yaratildi!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0d0f17]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isIndigo = selectedRole === "ASSISTANT_ADMIN";

  return (
    <div className="min-h-screen flex dark:bg-[#0d0f17] bg-gray-50">
      {/* ── Left panel ── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 max-w-xl">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold dark:text-white text-gray-900">
              MaternityCare
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-7 h-7 text-indigo-400" />
          <h1 className="text-3xl font-bold dark:text-white text-gray-900">
            Foydalanuvchi yaratish
          </h1>
        </div>
        <p className="dark:text-gray-400 text-gray-500 mb-8 text-sm">
          Yangi foydalanuvchi uchun rol va ma'lumotlarni kiriting
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ── Rol tanlash ── */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Rol tanlang
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                const cfg      = ROLE_CONFIG[role];
                const selected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setValue("role", role)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all",
                      selected
                        ? role === "ASSISTANT_ADMIN"
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-violet-500 bg-violet-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2 font-medium text-sm",
                      selected
                        ? role === "ASSISTANT_ADMIN" ? "text-indigo-400" : "text-violet-400"
                        : "dark:text-gray-300 text-gray-700"
                    )}>
                      {cfg.icon}
                      {cfg.label}
                    </div>
                    <span className="text-xs dark:text-gray-500 text-gray-400 leading-tight">
                      {cfg.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("role")} />
          </div>

          {/* ── Username ── */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
              Foydalanuvchi nomi
            </label>
            <input
              {...register("username", {
                required:  "Login kiritish shart",
                minLength: { value: 3, message: "Kamida 3 belgi" },
                pattern:   { value: /^[a-z0-9_]+$/, message: "Faqat kichik harf, raqam va _" },
              })}
              type="text"
              placeholder={selectedRole === "MINISTRY" ? "toshkent_ministry" : "assistant_admin"}
              className={cn("input-field", errors.username && "border-red-500 focus:ring-red-500")}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
            )}
          </div>

          {/* ── Parol ── */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <input
                {...register("password", {
                  required:  "Parol kiritish shart",
                  minLength: { value: 6, message: "Kamida 6 belgi" },
                })}
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className={cn("input-field pr-10", errors.password && "border-red-500 focus:ring-red-500")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* ── Parolni tasdiqlash ── */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1.5">
              Parolni tasdiqlang
            </label>
            <input
              {...register("confirmPassword", {
                required: "Parolni tasdiqlang",
                validate: (v) => v === watch("password") || "Parollar mos emas",
              })}
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              className={cn("input-field", errors.confirmPassword && "border-red-500 focus:ring-red-500")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* ── Info box ── */}
          <div className={cn(
            "p-3 rounded-lg border text-xs",
            isIndigo
              ? "bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-300 text-indigo-700"
              : "bg-violet-500/10 border-violet-500/20 dark:text-violet-300 text-violet-700"
          )}>
            Bu foydalanuvchi <strong>{config.label}</strong> roli bilan yaratiladi.{" "}
            {selectedRole === "MINISTRY"
              ? "Faqat statistika va hisobotlarni ko'ra oladi."
              : "To'lovni tahrirlashdan tashqari barcha superadmin imkoniyatlariga ega bo'ladi."}
          </div>

          {/* ── Buttons ── */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="btn-secondary flex-1"
            >
              Bekor qilish
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Yaratilmoqda...
                </span>
              ) : (
                "Yaratish"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Right panel — dinamik ── */}
      <div className={cn(
        "hidden lg:flex flex-1 relative overflow-hidden",
        isIndigo
          ? "bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900"
          : "bg-gradient-to-br from-violet-900 via-violet-800 to-purple-900"
      )}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize:  "32px 32px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 w-fit",
            isIndigo ? "bg-indigo-500/30" : "bg-violet-500/30"
          )}>
            {config.icon}
            {config.label}
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {config.label}<br />
            <span className={isIndigo ? "text-indigo-300" : "text-violet-300"}>
              huquqlari
            </span>
          </h2>
          <div className="space-y-3 mt-6">
            {config.permissions.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm",
                  item.ok ? "bg-white/10" : "bg-red-500/15 text-red-300"
                )}
              >
                <span>{item.ok ? "✅" : "❌"}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
      </div>
    </div>
  );
}
