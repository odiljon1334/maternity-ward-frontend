/**
 * Chiqishda qurilmada qolgan shaxsiy izlarni tozalash.
 *
 * Umumiy planshet/telefonda keyingi foydalanuvchi oldingisining
 * bildirishnomalarini olmasligi va service worker keshidan uning
 * ma'lumotlarini ko'rmasligi kerak.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

/** usePushNotification bilan bir xil kalit */
const PUSH_SUBSCRIBED_KEY = "push_subscribed";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    p,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

/**
 * Push obunasini bekor qiladi. `notifyServer` — sessiya hali yaroqli bo'lsa
 * (oddiy chiqish) serverdan ham o'chiriladi; 401 dan keyin esa faqat
 * brauzerda bekor qilinadi (server keyingi yuborishda 410 olib o'zi tozalaydi).
 */
async function unsubscribePush(notifyServer: boolean) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    const sub = await reg.pushManager?.getSubscription().catch(() => null);
    if (!sub) continue;
    if (notifyServer) {
      await fetch(`${BASE_URL}/push/unsubscribe`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => null);
    }
    await sub.unsubscribe().catch(() => false);
  }
  try {
    localStorage.removeItem(PUSH_SUBSCRIBED_KEY);
  } catch {
    /* ignore */
  }
}

/** Service worker runtime keshlari (precache — ilova fayllari — qoladi) */
async function clearRuntimeCaches() {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((n) => !n.startsWith("workbox-precache"))
      .map((n) => caches.delete(n)),
  );
}

export async function clearDeviceSession(opts: { notifyServer: boolean }) {
  await withTimeout(
    Promise.allSettled([unsubscribePush(opts.notifyServer), clearRuntimeCaches()]),
    3000,
  );
}
