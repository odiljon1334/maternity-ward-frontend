import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/panel/ComingSoon";

export default function PanelPermissionsPage() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      title="Ruxsatlar muharriri"
      description="Har bir modul uchun granular ruxsatlarni sozlash shu yerda bo'ladi (Reja.md, FAZA 5 — 6-bosqich)."
    />
  );
}
