/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sentry'ga shaxsiy ma'lumot ketmasligi uchun: URL query-string (qidiruvdagi
 * ism, telefon, token=...), cookie va so'rov tanasi olib tashlanadi.
 * Xato va stack trace saqlanadi — tahlil uchun shu yetarli.
 */
export function stripQuery(url: unknown): unknown {
  if (typeof url !== "string") return url;
  const i = url.search(/[?#]/);
  return i === -1 ? url : `${url.slice(0, i)}?[filtered]`;
}

export function scrubEvent<T>(event: T): T {
  const e = event as any;
  if (e?.request) {
    e.request.url = stripQuery(e.request.url);
    delete e.request.query_string;
    delete e.request.cookies;
    delete e.request.data;
    if (e.request.headers) {
      delete e.request.headers.cookie;
      delete e.request.headers.Cookie;
      delete e.request.headers.authorization;
      delete e.request.headers.Authorization;
    }
  }
  if (e?.user) e.user = e.user.id ? { id: e.user.id } : undefined;
  for (const b of e?.breadcrumbs ?? []) scrubBreadcrumb(b);
  return event;
}

export function scrubBreadcrumb<T>(breadcrumb: T): T {
  const b = breadcrumb as any;
  if (b?.data) {
    if ("url" in b.data) b.data.url = stripQuery(b.data.url);
    if ("from" in b.data) b.data.from = stripQuery(b.data.from);
    if ("to" in b.data) b.data.to = stripQuery(b.data.to);
  }
  // Konsol xabarlarida ism/telefon bo'lishi mumkin
  if (b?.category === "console") return null as any;
  return breadcrumb;
}
