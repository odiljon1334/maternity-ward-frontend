"use client";

import Link from "next/link";
import { cn, formatMinutes, getAvatarColor, getInitials } from "@/lib/utils";
import { photoThumbUrl } from "@/lib/api";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * "Ko'p kechikkanlar" ro'yxati.
 *
 * Ilgari davomat trendi yonidagi tor (1/3) ustunda edi va faqat 5 ta xodim
 * sig'ardi. Endi sahifa pastida to'liq kenglikda — ko'proq xodim va
 * qo'shimcha ustunlar bilan.
 */
export default function TopLateCard({ topLate }: { topLate?: any[] }) {
  const list = topLate ?? [];

  return (
    <div className="card bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              Ko&apos;p kechikkanlar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Shu oy bo&apos;yicha eng ko&apos;p kechikkan xodimlar
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/attendance"
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 font-semibold"
        >
          <span>Davomatga o&apos;tish</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Kechikish qayd etilmagan 🎉
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bu oyda hech kim kechikmagan
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5 w-12">#</th>
                <th className="px-5 py-3.5">Xodim</th>
                <th className="px-5 py-3.5">Bo&apos;lim</th>
                <th className="px-5 py-3.5">Necha marta</th>
                <th className="px-5 py-3.5 text-right">Jami kechikish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {list.map((emp: any, i: number) => {
                const thumb = photoThumbUrl(emp.photoUrl);
                return (
                  <tr
                    key={emp.employeeId ?? i}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                      {i + 1}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={emp.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-full h-full flex items-center justify-center text-xs font-semibold text-white",
                                getAvatarColor(emp.name || "")
                              )}
                            >
                              {getInitials(emp.name || "?")}
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {emp.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {emp.department || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {emp.lateCount} marta
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {formatMinutes(emp.totalLateMin)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
