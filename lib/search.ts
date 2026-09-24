/**
 * Xodimlarni ism-familiya bo'yicha qidirish uchun matnni bir ko'rinishga keltirish.
 *
 * Nimani hal qiladi:
 *  - So'zlar tartibi: "Dilnoza Karimova" ham, "Karimova Dilnoza" ham topadi
 *    (so'rovning har bir so'zi alohida qidiriladi).
 *  - Qisman yozish: "karim dil" → "Karimova Dilnoza".
 *  - Kirill/lotin: "Каримова" ↔ "Karimova" (ikkalasi ham lotinga o'giriladi).
 *  - Tutuq belgisi turlari: o' / o‘ / oʻ / o` / o’ → bir xil.
 *  - Katta-kichik harf, ortiqcha bo'shliqlar.
 */

const CYR_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g'", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
  и: "i", й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ў: "o'", ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "'", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Qidiruv uchun normallashtirilgan matn (kichik harf, lotin, bitta tutuq belgisi) */
export function normalizeSearchText(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.toLowerCase();
  s = s.replace(/[а-яёқғўҳ]/g, (ch) => CYR_TO_LAT[ch] ?? ch);
  // Barcha tutuq/apostrof turlari → '
  s = s.replace(/[ʻʼ‘’`´ʹ]/g, "'");
  // Qidiruvda tutuq belgisini hisobga olmaymiz: "ogil" ham "o'g'il" ni topsin
  s = s.replace(/'/g, "");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * So'rovning HAR BIR so'zi maydonlardan birida (istalgan tartibda) uchrasa — true.
 * Bo'sh so'rov har doim mos keladi.
 */
export function matchesSearch(query: string, fields: Array<string | null | undefined>): boolean {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fields.map(normalizeSearchText).join(" ");
  return tokens.every((t) => haystack.includes(t));
}
