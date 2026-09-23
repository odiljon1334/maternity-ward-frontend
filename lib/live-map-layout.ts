export type LiveMapLayoutPoint = {
  userId: string;
  latitude: number;
  longitude: number;
};

export type LiveMapMarkerLayout = {
  offset: [number, number];
  groupIndex: number;
  groupSize: number;
};

export type EmployeeWorkplaceInfo = {
  positionName?: string | null;
  departmentName?: string | null;
  hospitalName?: string | null;
};

export function getEmployeePositionLabel(info: EmployeeWorkplaceInfo) {
  return info.positionName?.trim() || "Lavozim ko‘rsatilmagan";
}

const EARTH_RADIUS_METERS = 6_371_000;
const NEARBY_THRESHOLD_METERS = 12;

function distanceInMeters(a: LiveMapLayoutPoint, b: LiveMapLayoutPoint) {
  const toRadians = Math.PI / 180;
  const lat1 = a.latitude * toRadians;
  const lat2 = b.latitude * toRadians;
  const deltaLat = (b.latitude - a.latitude) * toRadians;
  const deltaLng = (b.longitude - a.longitude) * toRadians;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const haversine = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

/**
 * Haqiqiy GPS koordinatalarini o‘zgartirmasdan, bir-biriga juda yaqin
 * markerlarni ekran pikseli bo‘yicha aylana shaklida ajratadi.
 */
export function buildLiveMapMarkerLayout(points: LiveMapLayoutPoint[]) {
  const sorted = [...points].sort((a, b) => a.userId.localeCompare(b.userId));
  const parent = sorted.map((_, index) => index);
  const buckets = new Map<string, number[]>();
  const latitudeScale = 111_320;
  const referenceLatitude = sorted.length
    ? sorted.reduce((sum, point) => sum + point.latitude, 0) / sorted.length
    : 0;
  const longitudeScale = latitudeScale * Math.cos(referenceLatitude * Math.PI / 180);

  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };

  const join = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  sorted.forEach((point, index) => {
    const cellX = Math.floor((point.longitude * longitudeScale) / NEARBY_THRESHOLD_METERS);
    const cellY = Math.floor((point.latitude * latitudeScale) / NEARBY_THRESHOLD_METERS);

    for (let xDelta = -1; xDelta <= 1; xDelta += 1) {
      for (let yDelta = -1; yDelta <= 1; yDelta += 1) {
        const nearby = buckets.get(`${cellX + xDelta}:${cellY + yDelta}`) ?? [];
        nearby.forEach((otherIndex) => {
          if (distanceInMeters(sorted[otherIndex], point) <= NEARBY_THRESHOLD_METERS) {
            join(otherIndex, index);
          }
        });
      }
    }

    const bucketKey = `${cellX}:${cellY}`;
    buckets.set(bucketKey, [...(buckets.get(bucketKey) ?? []), index]);
  });

  const groups = new Map<number, LiveMapLayoutPoint[]>();
  sorted.forEach((point, index) => {
    const root = find(index);
    const group = groups.get(root) ?? [];
    group.push(point);
    groups.set(root, group);
  });

  const layout = new Map<string, LiveMapMarkerLayout>();
  groups.forEach((group) => {
    const groupSize = group.length;
    const radius = Math.min(56, 28 + groupSize * 5);

    group.forEach((point, groupIndex) => {
      if (groupSize === 1) {
        layout.set(point.userId, { offset: [0, 0], groupIndex, groupSize });
        return;
      }

      const angle = -Math.PI / 2 + (2 * Math.PI * groupIndex) / groupSize;
      layout.set(point.userId, {
        offset: [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)],
        groupIndex,
        groupSize,
      });
    });
  });

  return layout;
}
