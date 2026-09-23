export type LiveLocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
};

type GeolocationLike = Pick<
  Geolocation,
  "getCurrentPosition" | "watchPosition" | "clearWatch"
>;

type TrackingResponse = { stopTracking?: boolean } | void;

type LiveLocationTrackerOptions = {
  geolocation: GeolocationLike;
  onPoint: (point: LiveLocationPoint) => Promise<TrackingResponse>;
  onError?: (error: GeolocationPositionError) => void;
  onSendError?: (error: unknown) => void;
  heartbeatMs?: number;
  movementThresholdM?: number;
  minimumMovementIntervalMs?: number;
  now?: () => number;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
};

export type LiveLocationTracker = {
  start: () => void;
  stop: () => void;
  refresh: () => void;
};

const DEFAULT_HEARTBEAT_MS = 3 * 60 * 1000;
const DEFAULT_MOVEMENT_THRESHOLD_M = 35;
const DEFAULT_MOVEMENT_INTERVAL_MS = 30 * 1000;

function distanceMeters(left: LiveLocationPoint, right: LiveLocationPoint) {
  const earthRadius = 6_371_000;
  const lat1 = (left.latitude * Math.PI) / 180;
  const lat2 = (right.latitude * Math.PI) / 180;
  const deltaLat = ((right.latitude - left.latitude) * Math.PI) / 180;
  const deltaLng = ((right.longitude - left.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toPoint(position: GeolocationPosition): LiveLocationPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    ...(position.coords.speed != null ? { speed: position.coords.speed } : {}),
  };
}

/**
 * Bitta faol smena uchun brauzer GPS kuzatuvi.
 *
 * Interface ataylab kichik: caller faqat start/stop/refresh ni biladi. Ichkarida
 * watchPosition, harakat bo'yicha throttling, statsionar xodim uchun heartbeat
 * va parallel so'rovlarning ketma-ketligi boshqariladi.
 */
export function createLiveLocationTracker({
  geolocation,
  onPoint,
  onError,
  onSendError,
  heartbeatMs = DEFAULT_HEARTBEAT_MS,
  movementThresholdM = DEFAULT_MOVEMENT_THRESHOLD_M,
  minimumMovementIntervalMs = DEFAULT_MOVEMENT_INTERVAL_MS,
  now = Date.now,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: LiveLocationTrackerOptions): LiveLocationTracker {
  let running = false;
  let watchId: number | null = null;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let lastSentAt: number | null = null;
  let lastSentPoint: LiveLocationPoint | null = null;
  let sending = false;
  let queued: { point: LiveLocationPoint; force: boolean } | null = null;

  const stop = () => {
    if (!running && watchId == null && heartbeatId == null) return;
    running = false;
    if (watchId != null) geolocation.clearWatch(watchId);
    if (heartbeatId != null) clearIntervalFn(heartbeatId);
    watchId = null;
    heartbeatId = null;
    queued = null;
  };

  const shouldSend = (point: LiveLocationPoint, force: boolean) => {
    if (force || lastSentAt == null || lastSentPoint == null) return true;
    const elapsed = now() - lastSentAt;
    return (
      elapsed >= minimumMovementIntervalMs &&
      distanceMeters(lastSentPoint, point) >= movementThresholdM
    );
  };

  const submit = async (point: LiveLocationPoint, force = false) => {
    if (!running || !shouldSend(point, force)) return;
    if (sending) {
      queued = { point, force: queued?.force === true || force };
      return;
    }

    sending = true;
    try {
      const result = await onPoint(point);
      if (!running) return;
      lastSentAt = now();
      lastSentPoint = point;
      if (result?.stopTracking) {
        stop();
        return;
      }
    } catch (error) {
      onSendError?.(error);
    } finally {
      sending = false;
      const next = queued;
      queued = null;
      if (next && running) void submit(next.point, next.force);
    }
  };

  const requestFreshPosition = () => {
    if (!running) return;
    geolocation.getCurrentPosition(
      (position) => void submit(toPoint(position), true),
      (error) => onError?.(error),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  };

  const start = () => {
    if (running) return;
    running = true;
    watchId = geolocation.watchPosition(
      (position) => void submit(toPoint(position)),
      (error) => onError?.(error),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 },
    );
    heartbeatId = setIntervalFn(requestFreshPosition, heartbeatMs);
  };

  return { start, stop, refresh: requestFreshPosition };
}
