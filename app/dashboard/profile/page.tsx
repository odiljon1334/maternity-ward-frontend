/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Building2, Briefcase, Hash, AtSign, Sparkles, ShieldCheck
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

  const emp = (profile as any)?.employee;
  
  // Ismni to'g'ri aniqlash (Avval employee.fullName, keyin ism/familiya, oxirida username)
  const fullName = emp?.fullName 
    ? emp.fullName 
    : emp && (emp.firstName || emp.lastName)
    ? `${emp.lastName || ""} ${emp.firstName || ""}`.trim()
    : (user?.username || "Foydalanuvchi");

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
    <div className="min-h-screen pb-24">
      <Topbar title="Profilim" subtitle="Shaxsiy ma'lumotlar va xavfsizlik" />

      <div className="p-4 lg:p-6 max-w-lg mx-auto space-y-6">

        {/* ── Kreativ Banner / Avatar Qismi ────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/40 via-[var(--bg-card)] to-[var(--bg-card)] border border-indigo-500/20 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-indigo-400">
            <Sparkles className="w-32 h-32" />
          </div>

          <div className="relative inline-block mx-auto mb-4">
            {emp?.photoUrl ? (
              <img
                src={photoUrl(emp.photoUrl)}
                alt={fullName}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/20"
              />
            ) : (
              <div
                className={cn(
                  "w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20",
                  getAvatarColor(fullName)
                )}
              >
                {getInitials(fullName)}
              </div>
            )}

            {/* Photo update button */}
            {emp && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoMut.isPending}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all border border-indigo-400/30 disabled:opacity-50 cursor-pointer"
                title="Rasmni yangilash"
              >
                {photoMut.isPending
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                  : <Camera className="w-4 h-4" />
                }
              </button>
            )}
          </div>

          {/* Hidden file input */}
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

          <div className="relative z-10 space-y-1">
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{fullName}</h2>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {emp?.position?.name || user?.role}
            </p>
          </div>
        </div>

        {/* ── Ma'lumotlar (Readonly Grid) ──────────────────── */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wider">Ma&apos;lumotlar</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              { icon: Building2,  label: "Bo'lim",   value: emp?.department?.name || "—", color: "text-blue-400",   bg: "bg-blue-500/10"   },
              { icon: Briefcase,  label: "Lavozim",  value: emp?.position?.name   || "—", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Hash,       label: "Xodim №",  value: emp?.employeeNo       || "—", color: "text-amber-400",   bg: "bg-amber-500/10"   },
              { icon: AtSign,     label: "Login",    value: user?.username         || "—", color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3.5 bg-[var(--bg-main)] rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl border border-white/5", bg, color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] text-right max-w-[55%] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Parolni o'zgartirish ─────────────────────────── */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wider">Parolni o&apos;zgartirish</span>
          </div>

          <div className="space-y-3.5">
            {/* Joriy parol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Joriy parol</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yangi parol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Yangi parol (kamida 6 ta belgi)</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tasdiqlash */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Yangi parolni tasdiqlang</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={cn(
                    "w-full bg-[var(--bg-main)] border rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors",
                    confirmPw && newPw !== confirmPw ? "border-red-500/50 focus:ring-red-500/40" : "border-[var(--border)]"
                  )}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-400 font-semibold flex items-center gap-1.5 px-1">
                ✕ Parollar mos kelmaydi
              </p>
            )}
            {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 px-1">
                ✓ Parollar mos keladi
              </p>
            )}

            <button
              onClick={() => passwordMut.mutate()}
              disabled={passwordMut.isPending || !pwValid}
              className="w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
            >
              {passwordMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Parolni saqlash
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Mavzu (Dark/Light Toggle) ────────────────────── */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] p-5 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {theme === "dark"
                ? <Moon className="w-5 h-5" />
                : <Sun  className="w-5 h-5 text-amber-500" />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {theme === "dark" ? "Qorong'u mavzu" : "Yorug' mavzu"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Ilova ko&apos;rinishini o&apos;zgartirish
              </p>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-14 h-8 rounded-full transition-colors relative p-1 border cursor-pointer",
              theme === "dark" ? "bg-indigo-600 border-indigo-500/40" : "bg-slate-700 border-slate-600"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full bg-white shadow-md transition-transform flex items-center justify-center text-slate-900",
                theme === "dark" ? "translate-x-6" : "translate-x-0"
              )}
            >
              {theme === "dark" ? <Moon className="w-3 h-3 text-indigo-900" /> : <Sun className="w-3 h-3 text-amber-500" />}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}