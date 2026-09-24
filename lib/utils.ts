import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Muassasa tanlab ishlaydigan platforma rollari. Bu huquqlar tengligini anglatmaydi. */
export function isSuperLike(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ASSISTANT_ADMIN";
}

export function formatNumber(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (amount === null || amount === undefined || isNaN(n)) return "0";
  // Deterministic space separator — SSR/CSR hydration mismatch bo'lmasligi uchun
  const parts = Math.round(n).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}

/**
 * Minglik guruhlash — qo'lda, Intl/toLocaleString'ga bog'liq EMAS.
 * Sabab: "uz-UZ" locale'ni server (Node ICU) va brauzer (client ICU)
 * har xil formatlashi mumkin (probel vs vergul) -> React hydration xatosi
 * ("Text content does not match server-rendered HTML"). Qo'lda regex
 * har doim, har qanday muhitda bir xil natija beradi.
 */
function groupThousands(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.round(Math.abs(n)).toString();
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatMoney(amount: number | string | null | undefined): string {
  const n = Number(amount);
  if (amount === null || amount === undefined || isNaN(n)) return "0 so'm";
  return groupThousands(n) + " so'm";
}

export function formatMinutes(min: number): string {
  if (!min || min <= 0) return "0 daqiqa";
  if (min < 60) return `${min} daqiqa`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

function formatTashkentDateTime(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const shifted = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(shifted.getUTCDate())}.${pad(shifted.getUTCMonth() + 1)} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

export function formatTerminalConnectivity(terminal: {
  onlineStatus?: string;
  lastSeenAt?: string | null;
  offlineSince?: string | null;
}): string {
  if (terminal.onlineStatus === "online") {
    return terminal.lastSeenAt
      ? `Online · ${formatTashkentDateTime(terminal.lastSeenAt)}`
      : "Online";
  }
  if (terminal.offlineSince) {
    return `${formatTashkentDateTime(terminal.offlineSince)} dan beri offline`;
  }
  if (terminal.lastSeenAt) {
    return `Oxirgi aloqa: ${formatTashkentDateTime(terminal.lastSeenAt)}`;
  }
  return "Aloqa vaqti hali aniqlanmadi";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getAvatarColor(name: string | null | undefined): string {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
    "bg-blue-500", "bg-rose-500", "bg-amber-500",
    "bg-teal-500", "bg-pink-500", "bg-cyan-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const naturalCollator = new Intl.Collator("uz", { numeric: true, sensitivity: "base" });
/** "2-maktab" < "13-maktab"; katta-kichik harf farqsiz */
export function naturalCompare(a: string, b: string): number {
  return naturalCollator.compare(a ?? "", b ?? "");
}
