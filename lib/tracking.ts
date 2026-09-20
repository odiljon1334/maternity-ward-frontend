/**
 * Marketing Tracking Utility
 * Handles UTM parameters extraction, storage, and analytics events (Meta Pixel, Google Tag Manager).
 */

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_page?: string;
  captured_at?: string;
}

const STORAGE_KEY = "clinicuk_utm_params";

/**
 * Capture UTM parameters from URL and store in localStorage/sessionStorage
 */
export function captureUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    const utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmTerm = urlParams.get("utm_term");
    const utmContent = urlParams.get("utm_content");

    // If there are UTM parameters in current URL, save them
    if (utmSource || utmMedium || utmCampaign) {
      const params: UtmParams = {
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        utm_term: utmTerm || undefined,
        utm_content: utmContent || undefined,
        referrer: document.referrer || undefined,
        landing_page: window.location.pathname,
        captured_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      return params;
    }

    // Otherwise return previously stored params if available
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Could not capture UTM params:", e);
  }

  return null;
}

/**
 * Get stored UTM parameters
 */
export function getStoredUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Could not parse UTM params:", e);
  }
  return {};
}

/**
 * Track custom marketing event (Meta Pixel, Google Tag Manager, custom logger)
 */
export function trackMarketingEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  const utmData = getStoredUtmParams();
  const payload = {
    ...params,
    ...utmData,
    timestamp: new Date().toISOString(),
  };

  // Google Tag Manager dataLayer
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: eventName,
      ...payload,
    });
  }

  // Meta Pixel fbq
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("trackCustom", eventName, payload);
  }

  // Console log in development
  if (process.env.NODE_ENV !== "production") {
    console.info(`[Tracking] Event: ${eventName}`, payload);
  }
}
