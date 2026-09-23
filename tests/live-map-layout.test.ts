import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLiveMapMarkerLayout,
  getEmployeePositionLabel,
  getLiveTrackingStatus,
  getVisibleLiveMapMarkers,
  sortLiveMapEmployees,
} from "../lib/live-map-layout";

test("bir xil joydagi xodim markerlari bir-birini yopmaydi", () => {
  const layout = buildLiveMapMarkerLayout([
    { userId: "employee-a", latitude: 40.7821, longitude: 72.3442 },
    { userId: "employee-b", latitude: 40.7821, longitude: 72.3442 },
  ]);

  assert.equal(layout.get("employee-a")?.groupSize, 2);
  assert.equal(layout.get("employee-b")?.groupSize, 2);
  assert.notDeepEqual(
    layout.get("employee-a")?.offset,
    layout.get("employee-b")?.offset,
    "ustma-ust markerlar turli ekran offsetiga ega bo‘lishi kerak",
  );
});

test("yolg‘iz marker GPS nuqtasining o‘zida qoladi", () => {
  const layout = buildLiveMapMarkerLayout([
    { userId: "employee-a", latitude: 40.7821, longitude: 72.3442 },
  ]);

  assert.deepEqual(layout.get("employee-a")?.offset, [0, 0]);
  assert.equal(layout.get("employee-a")?.groupSize, 1);
});

test("yaqin xodimlar ajratiladi, uzoq xodim o‘z joyida qoladi", () => {
  const layout = buildLiveMapMarkerLayout([
    { userId: "employee-a", latitude: 40.7821, longitude: 72.3442 },
    { userId: "employee-b", latitude: 40.78214, longitude: 72.3442 },
    { userId: "employee-c", latitude: 40.783, longitude: 72.3442 },
  ]);

  assert.equal(layout.get("employee-a")?.groupSize, 2);
  assert.equal(layout.get("employee-b")?.groupSize, 2);
  assert.deepEqual(layout.get("employee-c")?.offset, [0, 0]);
});

test("marker offsetlari server ro‘yxati tartibiga bog‘liq emas", () => {
  const points = [
    { userId: "employee-a", latitude: 40.7821, longitude: 72.3442 },
    { userId: "employee-b", latitude: 40.7821, longitude: 72.3442 },
    { userId: "employee-c", latitude: 40.7821, longitude: 72.3442 },
  ];

  const forward = buildLiveMapMarkerLayout(points);
  const reverse = buildLiveMapMarkerLayout([...points].reverse());

  for (const point of points) {
    assert.deepEqual(forward.get(point.userId), reverse.get(point.userId));
  }
});

test("marker labeli lavozimni, u bo‘lmasa tushunarli fallbackni ko‘rsatadi", () => {
  assert.equal(
    getEmployeePositionLabel({ positionName: "25-maktab hamshirasi" }),
    "25-maktab hamshirasi",
  );
  assert.equal(getEmployeePositionLabel({ positionName: null }), "Lavozim ko‘rsatilmagan");
});

test("10 daqiqadan eski GPS faol xodimni online deb ko‘rsatmaydi", () => {
  const now = new Date("2026-09-23T08:30:00.000Z").getTime();

  assert.equal(
    getLiveTrackingStatus(
      { createdAt: "2026-09-23T08:19:00.000Z", isOutside: false },
      now,
    ),
    "SIGNAL_LOST",
  );
});

test("yangi GPS nuqtasi geofence tashqarisida bo‘lsa OUTSIDE qaytaradi", () => {
  const now = new Date("2026-09-23T08:30:00.000Z").getTime();

  assert.equal(
    getLiveTrackingStatus(
      { createdAt: "2026-09-23T08:29:00.000Z", isOutside: true },
      now,
    ),
    "OUTSIDE",
  );
});

test("online xodim signal uzilganlardan oldin ko‘rsatiladi", () => {
  const now = new Date("2026-09-23T08:30:00.000Z").getTime();
  const employees = [
    { userId: "stale", name: "Stale", createdAt: "2026-09-23T06:00:00.000Z" },
    { userId: "outside", name: "Outside", createdAt: "2026-09-23T08:29:00.000Z", isOutside: true },
    { userId: "online", name: "Online", createdAt: "2026-09-23T08:28:00.000Z" },
  ];

  assert.deepEqual(
    sortLiveMapEmployees(employees, now).map((employee) => employee.userId),
    ["online", "outside", "stale"],
  );
});

test("stale markerlar online xaritani bosmaydi, faqat tanlanganda oxirgi joyi ko‘rinadi", () => {
  const now = new Date("2026-09-23T08:30:00.000Z").getTime();
  const employees = [
    { userId: "online", createdAt: "2026-09-23T08:28:00.000Z" },
    { userId: "stale-a", createdAt: "2026-09-23T06:00:00.000Z" },
    { userId: "stale-b", createdAt: "2026-09-23T07:00:00.000Z" },
  ];

  assert.deepEqual(
    getVisibleLiveMapMarkers(employees, now, "online").map((employee) => employee.userId),
    ["online"],
  );
  assert.deepEqual(
    getVisibleLiveMapMarkers(employees, now, "stale-a").map((employee) => employee.userId),
    ["online", "stale-a"],
  );
});
