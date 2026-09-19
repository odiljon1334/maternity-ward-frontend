import { History } from "lucide-react";
import { ComingSoon } from "@/components/panel/ComingSoon";

export default function PanelAuditPage() {
  return (
    <ComingSoon
      icon={History}
      title="Audit log"
      description="Superadmin va admin harakatlarining to'liq tarixi shu yerda ko'rinadi."
    />
  );
}
