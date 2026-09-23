export type LocationIssue =
  | "permission-denied"
  | "position-unavailable"
  | "timeout"
  | "unsupported"
  | "secure-context-required";

export type LocationPlatform =
  | "ios-pwa"
  | "ios-browser"
  | "android-pwa"
  | "android-browser"
  | "other";

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface LocationIssueContent {
  title: string;
  message: string;
  details: string[];
  canRetry: boolean;
}

interface GeolocationLike {
  getCurrentPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): void;
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    options?: PositionOptions,
  ): number;
  clearWatch(watchId: number): void;
}

interface AccurateLocationRequestOptions {
  geolocation: GeolocationLike;
  onPosition: (point: LocationPoint) => void;
  onIssue: (issue: LocationIssue) => void;
  onFinished?: () => void;
  targetAccuracyM?: number;
  initialTimeoutMs?: number;
  maxWaitMs?: number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}

export interface AccurateLocationRequest {
  stop(): void;
}

function normalizeLocationIssue(error: Pick<GeolocationPositionError, "code">): LocationIssue {
  if (error.code === 1) return "permission-denied";
  if (error.code === 2) return "position-unavailable";
  return "timeout";
}

function toLocationPoint(position: GeolocationPosition): LocationPoint {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

/**
 * Mobil PWA uchun permission so'rovini foydalanuvchi harakatiga bevosita
 * bog'laydi: avval bir martalik getCurrentPosition, keyin kerak bo'lsa aniqroq
 * natija uchun watchPosition. Permissions API faqat maslahat uchun ham
 * ishlatilmaydi — ayrim iOS PWA versiyalarida uning holati ishonchli emas.
 */
export function createAccurateLocationRequest({
  geolocation,
  onPosition,
  onIssue,
  onFinished,
  targetAccuracyM = 25,
  initialTimeoutMs = 10_000,
  maxWaitMs = 25_000,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}: AccurateLocationRequestOptions): AccurateLocationRequest {
  let best: LocationPoint | null = null;
  let watchId: number | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let finished = false;

  const clearResources = () => {
    if (watchId !== null) {
      geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  };

  const stop = () => {
    if (finished) return;
    finished = true;
    clearResources();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    clearResources();
    onFinished?.();
  };

  const fail = (issue: LocationIssue) => {
    if (finished) return;
    onIssue(issue);
    finish();
  };

  const acceptPosition = (position: GeolocationPosition) => {
    if (finished) return;
    const next = toLocationPoint(position);
    if (!best || next.accuracy < best.accuracy) {
      best = next;
      onPosition(next);
    }
    if (next.accuracy <= targetAccuracyM) finish();
  };

  const startHighAccuracyWatch = () => {
    if (finished || watchId !== null) return;

    const newWatchId = geolocation.watchPosition(
      acceptPosition,
      (error) => {
        if (finished) return;
        const issue = normalizeLocationIssue(error);
        if (issue === "permission-denied" || !best) fail(issue);
        else finish();
      },
      { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 },
    );

    // Mock yoki noodatiy brauzer callbackni sinxron chaqirsa ham watch ochiq
    // qolib ketmasin.
    if (finished) {
      geolocation.clearWatch(newWatchId);
      return;
    }
    watchId = newWatchId;
    timerId = setTimer(() => {
      if (best) finish();
      else fail("timeout");
    }, maxWaitMs);
  };

  geolocation.getCurrentPosition(
    (position) => {
      acceptPosition(position);
      if (!finished) startHighAccuracyWatch();
    },
    (error) => {
      const issue = normalizeLocationIssue(error);
      // Permission rad etilgan bo'lsa qayta prompt qilmaymiz. GPS hali tayyor
      // bo'lmasa yoki bir martalik so'rov timeout bo'lsa, watchPosition qolgan
      // vaqt davomida koordinata topishga urinadi.
      if (issue === "permission-denied") fail(issue);
      else startHighAccuracyWatch();
    },
    {
      enableHighAccuracy: false,
      timeout: initialTimeoutMs,
      maximumAge: 30_000,
    },
  );

  return { stop };
}

export function detectLocationPlatform(userAgent: string, standalone: boolean): LocationPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return standalone ? "ios-pwa" : "ios-browser";
  if (/Android/i.test(userAgent)) return standalone ? "android-pwa" : "android-browser";
  return "other";
}

export function getLocationIssueContent(
  issue: LocationIssue,
  platform: LocationPlatform,
): LocationIssueContent {
  if (issue === "unsupported") {
    return {
      title: "GPS qo'llab-quvvatlanmaydi",
      message: "Ushbu brauzer joylashuvni aniqlash imkonini bermayapti.",
      details: ["Safari yoki Chrome'ning yangilangan versiyasida qayta oching."],
      canRetry: false,
    };
  }

  if (issue === "secure-context-required") {
    return {
      title: "Xavfsiz ulanish kerak",
      message: "Joylashuv faqat HTTPS orqali ishlaydi.",
      details: ["Saytni https://clinicuk24.com manzilidan qayta oching."],
      canRetry: false,
    };
  }

  if (issue === "position-unavailable") {
    return {
      title: "GPS signali topilmadi",
      message: "Qurilma hozir aniq joylashuvni bera olmadi.",
      details: [
        "Telefonning Location Services/GPS funksiyasini yoqing.",
        "Deraza yoniga yoki ochiq joyga chiqib qayta urinib ko'ring.",
      ],
      canRetry: true,
    };
  }

  if (issue === "timeout") {
    return {
      title: "Joylashuvni aniqlash cho'zildi",
      message: "Belgilangan vaqt ichida GPS javobi kelmadi.",
      details: [
        "Internet va GPS yoqilganini tekshiring.",
        "Ochiq joyda «Qayta urinish» tugmasini bosing.",
      ],
      canRetry: true,
    };
  }

  if (platform === "ios-pwa") {
    return {
      title: "MatWard uchun joylashuv ruxsatini yoqing",
      message: "PWA uchun ruxsat Safari brauzeridagi ruxsatdan alohida ko'rinishi mumkin.",
      details: [
        "Sozlamalar → Privacy & Security → Location Services bo'limini oching.",
        "MatWard uchun «While Using the App» ni tanlang.",
        "Aniq joylashuv (Precise Location) funksiyasini yoqing.",
      ],
      canRetry: true,
    };
  }

  if (platform === "ios-browser") {
    return {
      title: "Safari uchun joylashuv ruxsatini yoqing",
      message: "Saytning joylashuv ruxsati rad etilgan.",
      details: [
        "Safari'da clinicuk24.com sayt sozlamalarini oching.",
        "Location uchun «Allow» ni tanlang va Aniq joylashuvni yoqing.",
      ],
      canRetry: true,
    };
  }

  if (platform === "android-pwa") {
    return {
      title: "MatWard uchun joylashuv ruxsatini yoqing",
      message: "Android ilova yoki sayt darajasida GPS ruxsati yopilgan.",
      details: [
        "Sozlamalar → Ilovalar → MatWard/Chrome → Ruxsatlar → Joylashuvni yoqing.",
        "Chrome → Sayt sozlamalari → Joylashuv → clinicuk24.com uchun «Ruxsat berish»ni tanlang.",
      ],
      canRetry: true,
    };
  }

  if (platform === "android-browser") {
    return {
      title: "Chrome uchun joylashuv ruxsatini yoqing",
      message: "Qurilma yoki sayt darajasida GPS ruxsati yopilgan.",
      details: [
        "Sozlamalar → Ilovalar → Chrome → Ruxsatlar → Joylashuvni yoqing.",
        "Chrome → Sayt sozlamalari → Joylashuv → clinicuk24.com uchun «Ruxsat berish»ni tanlang.",
      ],
      canRetry: true,
    };
  }

  return {
    title: "Joylashuvga ruxsat berilmagan",
    message: "Brauzer sozlamalarida clinicuk24.com uchun joylashuvga ruxsat bering.",
    details: ["Ruxsatni yoqqach, ushbu sahifaga qaytib qayta urinib ko'ring."],
    canRetry: true,
  };
}
