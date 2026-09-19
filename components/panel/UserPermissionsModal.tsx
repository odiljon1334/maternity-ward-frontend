"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, ShieldCheck, RotateCcw } from "lucide-react";
import { usersApi } from "@/lib/api";

// Backenddagi src/common/permissions.ts katalogiga mos (qo'lda sinxron
// saqlanadi — yangi ruxsat qo'shilsa, ikkalasi ham yangilanishi kerak).
const PERMISSION_GROUPS: { module: string; items: { key: string; label: string }[] }[] = [
  {
    module: "Ish haqi (Payroll)",
    items: [
      { key: "payroll.view", label: "Ish haqi ma'lumotlarini ko'rish" },
      { key: "payroll.approve", label: "Ish haqini tasdiqlash" },
    ],
  },
  {
    module: "To'lovlar (Payments)",
    items: [
      { key: "payments.view", label: "To'lovlarni ko'rish" },
      { key: "payments.edit", label: "To'lov qo'shish/tahrirlash" },
    ],
  },
  {
    module: "Davomat",
    items: [{ key: "attendance.view", label: "Davomatni ko'rish" }],
  },
  {
    module: "Xodimlar",
    items: [{ key: "employees.edit", label: "Xodimlarni tahrirlash" }],
  },
  {
    module: "Hisobotlar",
    items: [{ key: "reports.view", label: "Hisobotlarni ko'rish/yuklab olish" }],
  },
];

type PermissionsData = {
  userId: string;
  role: string;
  defaults: string[];
  overrides: { permission: string; granted: boolean; updatedAt: string }[];
  effective: string[];
};

export function UserPermissionsModal({
  userId,
  userLabel,
  onClose,
}: {
  userId: string;
  userLabel: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PermissionsData>({
    queryKey: ["user-permissions", userId],
    queryFn: () => usersApi.getPermissions(userId),
  });

  const mutation = useMutation({
    mutationFn: ({ permission, granted }: { permission: string; granted: boolean | null }) =>
      usersApi.setPermission(userId, permission, granted),
    onSuccess: (result) => {
      qc.setQueryData(["user-permissions", userId], result);
      qc.invalidateQueries({ queryKey: ["panel-users"] });
      toast.success("Ruxsat yangilandi");
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Xatolik yuz berdi";
      toast.error(msg);
    },
  });

  const effective = new Set(data?.effective ?? []);
  const overrideMap = new Map((data?.overrides ?? []).map((o) => [o.permission, o.granted]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Ruxsatlar</h2>
              <p className="text-xs text-[var(--text-muted)]">{userLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-[var(--text-muted)]">
              Standart holat — bu foydalanuvchining roli ({data?.role}) bo&apos;yicha avtomatik beriladigan
              ruxsatlar. Kerak bo&apos;lsa, alohida shu foydalanuvchi uchun o&apos;chirib/yoqib qo&apos;yishingiz
              mumkin.
            </p>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.module}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {group.module}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isOn = effective.has(item.key);
                    const hasOverride = overrideMap.has(item.key);
                    const isDefault = (data?.defaults ?? []).includes(item.key);
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2"
                      >
                        <div>
                          <div className="text-sm text-[var(--text-primary)]">{item.label}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {hasOverride
                              ? isOn
                                ? "Standartdan tashqari berilgan"
                                : "Standartdan olib tashlangan"
                              : isDefault
                                ? "Standart bo'yicha ochiq"
                                : "Standart bo'yicha yopiq"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasOverride && (
                            <button
                              title="Standartga qaytarish"
                              disabled={mutation.isPending}
                              onClick={() => mutation.mutate({ permission: item.key, granted: null })}
                              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)]"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            role="switch"
                            aria-checked={isOn}
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ permission: item.key, granted: !isOn })}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                              isOn ? "bg-indigo-500" : "bg-[var(--bg-hover)]"
                            } ${hasOverride ? "ring-2 ring-amber-500/50" : ""}`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                isOn ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
