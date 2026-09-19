import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/panel/ComingSoon";

export default function PanelPaymentsPage() {
  return (
    <ComingSoon
      icon={CreditCard}
      title="To'lovlar va qarzdorlik"
      description="Ko'p oylik qarzdorlik hisoboti va avtomatik eslatmalar shu yerda boshqariladi (Reja.md, FAZA 5 — 1 va 2-bosqich)."
    />
  );
}
