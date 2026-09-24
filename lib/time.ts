import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Tizim vaqti — barcha davomat va smenalar shu zonada hisoblanadi */
export const APP_TZ = "Asia/Tashkent";

/**
 * Sana/vaqt Toshkent vaqti bo'yicha. Telefon boshqa vaqt zonasida bo'lsa
 * ham (masalan Moskva vaqti) smena vaqtlari va "bugun" to'g'ri chiqadi.
 */
export function tzTime(d?: dayjs.ConfigType) {
  return dayjs(d).tz(APP_TZ);
}
