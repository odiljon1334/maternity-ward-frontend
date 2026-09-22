"use client";

import { PaymentManagement } from "@/components/payments/PaymentManagement";

export default function PanelPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          MOLIYAVIY BOSHQARUV
        </div>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">
          To&apos;lovlar va qarzdorlik
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Muassasalar to&apos;lovlari, joriy holat va ko&apos;p oylik
          qarzdorlikni boshqaring.
        </p>
      </div>

      <PaymentManagement embedded />
    </div>
  );
}
