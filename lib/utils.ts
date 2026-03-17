import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** SUPER_ADMIN yoki ASSISTANT_ADMIN — har ikkalasi uchun bir xil huquqlar */
export function isSuperLike(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ASSISTANT_ADMIN";
}

export function formatMoney(amount: number | string): string {
  return Number(amount).toLocaleString("uz-UZ") + " so'm";
}

export function formatMinutes(min: number): string {
  if (!min || min <= 0) return "0 daqiqa";
  if (min < 60) return `${min} daqiqa`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
    "bg-blue-500", "bg-rose-500", "bg-amber-500",
    "bg-teal-500", "bg-pink-500", "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
