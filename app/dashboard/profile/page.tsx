"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, employeesApi, photoUrl } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "next-themes";
import {
  User, Lock, Sun, Moon, Camera, Eye, EyeOff,
  Building2, Briefcase, Hash, AtSign,
} from "lucide-react";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // Password fields
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Profile query ─────────────────────────────────────────
  const { data: profile, refetch } = useQuery({
    queryKey: ["auth-profile"],
    queryFn:  () => authApi.profile(),
  });

  const emp      = (profile as any)?.employee;
  const fullName = emp
    ? `${emp.lastName || ""} ${emp.firstName || ""}`.trim() || user?.username
    : user?.username;

  // ── Photo upload ──────────────────────────────────────────
  const photoMut = useMutation({
    mutationFn: (file: File) => employeesApi.uploadPhoto(emp?.id, file),
    onSuccess: () => { toast.success("Rasm yangilandi"); refetch(); },
    onError:   () => toast.error("Rasmni yuklashda xatolik"),
  });

  // ── Password change ───────────────────────────────────────
  const passwordMut = useMutation({
    mutationFn: () =>
      authApi.changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli o'zgartirildi!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const pwValid =
    currentPw.length > 0 &&
    newPw.length >= 6 &&
    newPw === confirmPw;

  // ─────────────────────────────────────────────────────────
  return (
    <div>
      <Topbar title="Profilim" subtitle="Shaxsiy ma'lumotlar" />

      <div className="p-4 lg:p-6 max-w-lg mx-auto space-y-4 pb-24 sm:pb-6">

        {/* ── Avatar + Ism ─────────────────────────────────── */}
        <div className="card p-6 flex flex-col items-center gap-4">
          <div className="relative">
            {emp?.photoUrl ? (
              <img
                src={photoUrl(emp.photoUrl)}
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg"
              />
            ) : (
              <div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg",
                  getAvatarColor(user?.username || "")
                )}
              >
                {getInitials(user?.username || "")}
              </div>
            )}

            {/* Photo update button — only if employee record exists */}
            {emp && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoMut.isPending}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors disabled:opacity-50"
                title="Rasmni yangilash"
              >
                {photoMut.isPending
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                  : <Camera className="w-3.5 h-3.5" />
                }
              </button>
            )}
          </div>

          {/* Hidden file input — capture="user" opens front camera on mobile */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { photoMut.mutate(f); e.target.value = ""; }
            }}
          />

          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{fullName}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {emp?.position?.name || user?.role}
            </p>
          </div>
        </div>

        {/* ── Ma'lumotlar (readonly) ───────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm text-[var(--text-primary)]">Ma&apos;lumotlar</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {[
              { icon: Building2,  label: "Bo'lim",   value: emp?.department?.name || "—", color: "text-blue-400"   },
              { icon: Briefcase,  label: "Lavozim",  value: emp?.position?.name   || "—", color: "text-emerald-400" },
              { icon: Hash,       label: "Xodim №",  value: emp?.employeeNo       || "—", color: "text-amber-400"  },
              { icon: AtSign,     label: "Login",    value: user?.username         || "—", color: "text-purple-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
                  <span className="text-sm text-[var(--text-muted)]">{label}</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[55%] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Parolni o'zgartirish ─────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-sm text-[var(--text-primary)]">Parolni o&apos;zgartirish</span>
          </div>

          <div className="p-4 space-y-3">
            {/* Joriy parol */}
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Joriy parol"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="input-field pr-10 text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Yangi parol */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Yangi parol (kamida 6 ta belgi)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="input-field pr-10 text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Tasdiqlash */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Yangi parolni tasdiqlang"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className={cn(
                  "input-field pr-10 text-sm",
                  confirmPw && newPw !== confirmPw && "border-red-500/50 focus:border-red-500"
                )}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                ✗ Parollar mos kelmaydi
              </p>
            )}
            {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                ✓ Parollar mos keladi
              </p>
            )}

            <button
              onClick={() => passwordMut.mutate()}
              disabled={passwordMut.isPending || !pwValid}
              className="btn-primary w-full py-2.5 text-sm mt-1"
            >
              {passwordMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </span>
              ) : "Parolni saqlash"}
            </button>
          </div>
        </div>

        {/* ── Mavzu (dark/light toggle) ────────────────────── */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {theme === "dark"
              ? <Moon className="w-4 h-4 text-indigo-400" />
              : <Sun  className="w-4 h-4 text-amber-400"  />
            }
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {theme === "dark" ? "Qorong'u mavzu" : "Yorug' mavzu"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Ilova ko'rinishini o'zgartirish
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors duration-300",
              theme === "dark" ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                theme === "dark" ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
