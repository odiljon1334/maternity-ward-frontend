"use client";
import { useState } from "react";
import { Stethoscope, Factory, Laptop, Store, Check } from "lucide-react";
import { INDUSTRY_USE_CASES, type IndustryUseCase } from "@/lib/marketing/use-cases";

const ICONS: Record<IndustryUseCase["icon"], typeof Stethoscope> = {
  stethoscope: Stethoscope,
  factory: Factory,
  laptop: Laptop,
  store: Store,
};

export function IndustryUseCases() {
  const [active, setActive] = useState(INDUSTRY_USE_CASES[0].key);
  const current = INDUSTRY_USE_CASES.find((u) => u.key === active) ?? INDUSTRY_USE_CASES[0];
  const ActiveIcon = ICONS[current.icon];

  return (
    <section className="mx-auto max-w-4xl">
      <div className="text-center">
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          SOHANGIZGA MOSLASHGAN
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Har bir soha uchun o&apos;ziga mos yechim
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          StaffPulse turli sohadagi jamoalarning o&apos;ziga xos ehtiyojlariga moslashadi.
        </p>
      </div>

      {/* Tab tugmalari */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {INDUSTRY_USE_CASES.map((u) => {
          const Icon = ICONS[u.icon];
          const isActive = u.key === active;
          return (
            <button
              key={u.key}
              onClick={() => setActive(u.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {u.name}
            </button>
          );
        })}
      </div>

      {/* Aktiv tab kontenti */}
      <div className="card mt-6 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <ActiveIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{current.name}</h3>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">{current.pitch}</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {current.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--text-primary)]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
