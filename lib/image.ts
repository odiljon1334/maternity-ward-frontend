/**
 * Rasmni YUBORISHDAN OLDIN brauzerda siqish.
 *
 * Muammo: telefon kamerasi 4000x3000 (3-10 MB) rasm beradi va u xom holda
 * serverga yuborilardi. Kasalxona internetida bu 1-2 daqiqa davom etardi.
 * Server esa uni baribir 800x800 (~100 KB) ga siqadi, terminalga 600x600
 * ketadi — ya'ni yuborilgan baytlarning deyarli hammasi tashlab yuboriladi.
 *
 * Bu yerda rasm brauzerning o'zida kichraytiriladi: ~30-60 barobar kam
 * ma'lumot, yuklash bir necha soniyaga tushadi. Yuz aniqlash sifati
 * o'zgarmaydi — 1280px server talabidan (800px) baribir katta.
 */

/** Natijaviy rasmning eng uzun tomoni (piksel) */
const DEFAULT_MAX_SIZE = 1280;
/** JPEG sifati */
const DEFAULT_QUALITY = 0.85;
/** Shu hajmdan kichik rasmlar tegilmaydi */
const SKIP_BELOW_BYTES = 400_000;

type Loaded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

/**
 * Faylni chizishga tayyor holatga keltiradi.
 *
 * `createImageBitmap` EXIF burilishini o'zi hisobga oladi
 * (`imageOrientation: "from-image"`) — aks holda telefonda yonboshlab
 * tushirilgan rasm teskari saqlanib qolardi.
 */
async function loadImage(file: File): Promise<Loaded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Eski brauzer yoki qo'llab-quvvatlanmaydigan format — pastdagi usul
    }
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    img.src = url;
  });
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

/** Fayl nomini .jpg ga o'zgartiradi */
function toJpgName(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

/**
 * Rasmni kichraytirib JPEG qilib qaytaradi.
 *
 * ⚠️ Hech qachon xato tashlamaydi: biror bosqich ishlamasa, ASL fayl
 * qaytariladi. Siqish — tezlashtirish uchun, yuklashni to'xtatish uchun emas.
 */
export async function compressImage(
  file: File,
  opts: { maxSize?: number; quality?: number } = {},
): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  let loaded: Loaded | null = null;
  try {
    loaded = await loadImage(file);
    const { source, width, height } = loaded;
    if (!width || !height) return file;

    const scale = Math.min(1, maxSize / Math.max(width, height));

    // Allaqachon kichik va yengil bo'lsa — tegmaymiz
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return file;

    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Shaffof PNG larda qora fon chiqmasligi uchun
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    // Siqish foyda bermagan bo'lsa asl faylni qoldiramiz
    if (blob.size >= file.size) return file;

    return new File([blob], toJpgName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    loaded?.cleanup();
  }
}

/** Loglar uchun: 5242880 → "5.0 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
