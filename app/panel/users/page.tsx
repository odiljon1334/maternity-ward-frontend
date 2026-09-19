/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { usersApi } from "@/lib/api";
import { UserPermissionsModal } from "@/components/panel/UserPermissionsModal";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MINISTRY: "Vazirlik",
  ASSISTANT_ADMIN: "Yordamchi Admin",
  ADMIN: "Admin",
  DIRECTOR: "Direktor",
  DEPARTMENT_HEAD: "Bo'lim boshlig'i",
  EMPLOYEE: "Xodim",
};

// Shu paneldan tayinlanadigan rollar — SUPER_ADMIN/MINISTRY (platforma
// darajasi) bu yerdan o'zgartirilmaydi, backend ham buni rad etadi.
const ASSIGNABLE_ROLES = ["ASSISTANT_ADMIN", "ADMIN", "DIRECTOR", "DEPARTMENT_HEAD", "EMPLOYEE"];
const PLATFORM_ROLES = ["SUPER_ADMIN", "MINISTRY"];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Faol",
  INACTIVE: "Nofaol",
  SUSPENDED: "Bloklangan",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  SUSPENDED: "bg-red-500/10 text-red-500 border-red-500/20",
};

function lastLoginText(v: string | null) {
  if (!v) return "Hech qachon kirmagan";
  const d = new Date(v);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Bugun";
  if (diffDays === 1) return "Kecha";
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return d.toLocaleDateString("uz-UZ");
}

export default function PanelUsersPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [permissionsUser, setPermissionsUser] = useState<{ id: string; label: string } | null>(
    null,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val.trim());
      setPage(1);
    }, 350);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["panel-users", search, role, status, page],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        limit,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      usersApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-users"] });
      toast.success("Status yangilandi");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-users"] });
      toast.success("Rol yangilandi");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">PLATFORMA BOSHQARUVI</div>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
          Foydalanuvchilar
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Barcha shifoxonalardagi foydalanuvchilar — rol va statusni shu yerdan boshqaring.
        </p>
      </div>

      {/* Filtrlar */}
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ism yoki login bo'yicha qidirish..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Barcha rollar</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Barcha statuslar</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">Yuklanmoqda...</div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-400">Ma&apos;lumotlarni yuklashda xatolik yuz berdi</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <UsersIcon className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Hech qanday foydalanuvchi topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3">F.I.Sh / Login</th>
                  <th className="px-5 py-3">Shifoxona</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Oxirgi kirish</th>
                  <th className="px-5 py-3">Ruxsatlar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const isPlatform = PLATFORM_ROLES.includes(u.role);
                  return (
                    <tr key={u.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {u.employee?.fullName || u.username}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          @{u.username}
                          {u.employee?.position?.name ? ` · ${u.employee.position.name}` : ""}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {u.hospital?.name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        {isPlatform ? (
                          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-500">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={roleMutation.isPending}
                            onChange={(e) =>
                              roleMutation.mutate({ id: u.id, role: e.target.value })
                            }
                            className="input-field w-auto py-1.5 text-xs"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isPlatform ? (
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[u.status]}`}
                          >
                            {STATUS_LABELS[u.status] || u.status}
                          </span>
                        ) : (
                          <select
                            value={u.status}
                            disabled={statusMutation.isPending}
                            onChange={(e) =>
                              statusMutation.mutate({ id: u.id, status: e.target.value })
                            }
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[u.status]}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)]">
                        {lastLoginText(u.lastLoginAt)}
                      </td>
                      <td className="px-5 py-3">
                        {isPlatform ? (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        ) : (
                          <button
                            onClick={() =>
                              setPermissionsUser({
                                id: u.id,
                                label: u.employee?.fullName || u.username,
                              })
                            }
                            className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Ruxsatlar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <p className="text-xs text-[var(--text-muted)]">
              Jami {meta.total} ta foydalanuvchi — {meta.page}/{meta.totalPages}-sahifa
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {permissionsUser && (
        <UserPermissionsModal
          userId={permissionsUser.id}
          userLabel={permissionsUser.label}
          onClose={() => setPermissionsUser(null)}
        />
      )}
    </div>
  );
}
