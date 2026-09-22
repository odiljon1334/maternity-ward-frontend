"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import { UserPermissionsModal } from "@/components/panel/UserPermissionsModal";

type UserItem = {
  id: string;
  username: string;
  role: string;
  status: string;
  hospital?: { name: string } | null;
  employee?: { fullName: string } | null;
};

type UsersResponse = {
  data: UserItem[];
  meta: { total: number; page: number; totalPages: number };
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  MINISTRY: "Vazirlik",
  ASSISTANT_ADMIN: "Yordamchi Admin",
  ADMIN: "Admin",
  DIRECTOR: "Direktor",
  DEPARTMENT_HEAD: "Bo'lim boshlig'i",
  EMPLOYEE: "Xodim",
};

const MANAGED_ROLES = [
  "ASSISTANT_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "DEPARTMENT_HEAD",
  "EMPLOYEE",
];

export default function PanelPermissionsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const limit = 20;

  const { data, isLoading, isError } = useQuery<UsersResponse>({
    queryKey: ["permissions-users", search, role, page],
    queryFn: () =>
      usersApi.list({
        search: search || undefined,
        role: role || undefined,
        page,
        limit,
      }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };

  function handleSearch(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 350);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          XAVFSIZLIK VA RUXSATLAR
        </div>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
          Ruxsatlar muharriri
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Rol standartini buzmasdan, alohida foydalanuvchiga qo&apos;shimcha
          ruxsat bering yoki mavjud ruxsatni cheklang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Boshqariladigan modullar",
            value: "5 ta",
            icon: ShieldCheck,
          },
          { label: "Granular ruxsatlar", value: "7 ta", icon: KeyRound },
          { label: "Foydalanuvchilar", value: String(meta.total), icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {value}
              </div>
              <div className="text-xs text-[var(--text-muted)]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-[var(--text-muted)]">
        Granular ruxsat rol chegarasini kengaytirmaydi. Masalan, rolga umuman
        yopiq endpointni bu yerdan ochib bo&apos;lmaydi; u faqat rol doirasidagi
        amallarni foydalanuvchi kesimida aniqlashtiradi.
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchInput}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Ism yoki login bo'yicha qidirish..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Barcha boshqariladigan rollar</option>
          {MANAGED_ROLES.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            Yuklanmoqda...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-500">
            Foydalanuvchilarni yuklab bo&apos;lmadi
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            Boshqariladigan foydalanuvchi topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-medium">Foydalanuvchi</th>
                  <th className="px-5 py-3 font-medium">Muassasa</th>
                  <th className="px-5 py-3 font-medium">Rol</th>
                  <th className="px-5 py-3 font-medium">Holat</th>
                  <th className="px-5 py-3 font-medium">Amal</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const label = user.employee?.fullName || user.username;
                  const isManaged = MANAGED_ROLES.includes(user.role);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)]"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          @{user.username}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-primary)]">
                        {user.hospital?.name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-500">
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                        {user.status === "ACTIVE" ? "Faol" : user.status}
                      </td>
                      <td className="px-5 py-3">
                        {isManaged ? (
                          <button
                            onClick={() => setSelected({ id: user.id, label })}
                            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Sozlash
                          </button>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            Platforma roli
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              {meta.page}/{meta.totalPages}-sahifa
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() =>
                  setPage((value) => Math.min(meta.totalPages, value + 1))
                }
                className="btn-ghost p-1.5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <UserPermissionsModal
          userId={selected.id}
          userLabel={selected.label}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
