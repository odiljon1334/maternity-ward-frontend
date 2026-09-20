import { Clock, CheckCircle2 } from "lucide-react";
import { INTEGRATIONS, INTEGRATION_STATUS_LABELS, type IntegrationStatus } from "@/lib/marketing/integrations";

const STATUS_STYLES: Record<IntegrationStatus, { badge: string; Icon: typeof Clock }> = {
  planned: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    Icon: Clock,
  },
  compatible: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    Icon: CheckCircle2,
  },
};

export function IntegrationsSection() {
  return (
    <section className="mx-auto max-w-4xl">
      <div className="text-center">
        <div className="text-[10px] font-semibold tracking-wider text-indigo-500">
          YO&apos;L XARITASI
        </div>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          O&apos;zbekiston bozoriga mos integratsiyalar
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Buxgalteriya, kadrlar hisobi va to&apos;lov tizimlari bilan ishlashni osonlashtirish uchun
          rejalashtirilgan yo&apos;nalishlar.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {INTEGRATIONS.map((item) => {
          const { badge, Icon } = STATUS_STYLES[item.status];
          return (
            <div key={item.key} className="card flex flex-col rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h3>
                <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge}`}>
                  <Icon className="h-3 w-3" />
                  {INTEGRATION_STATUS_LABELS[item.status]}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
