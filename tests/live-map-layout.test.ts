import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveMapMarkerLayout, getEmployeePositionLabel } from "../lib/live-map-layout";

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
