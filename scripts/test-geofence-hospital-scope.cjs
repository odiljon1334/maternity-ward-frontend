const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const geofencePanel = fs.readFileSync(
  path.join(root, "components/settings/GeofencePanel.tsx"),
  "utf8",
);
const settingsPage = fs.readFileSync(
  path.join(root, "app/dashboard/settings/page.tsx"),
  "utf8",
);
const employeeSites = fs.readFileSync(
  path.join(root, "components/employees/EmployeeWorkSites.tsx"),
  "utf8",
);

assert.match(
  settingsPage,
  /<GeofencePanel\s+hospitalId=\{isSuperLike\(user\?\.role\) \? targetHospitalId : undefined\}/,
  "Sozlamalar sahifasi tanlangan muassasani GeofencePanel'ga uzatishi kerak",
);

assert.match(
  employeeSites,
  /<GeofencePanel[\s\S]*?hospitalId=\{superLike \? hospitalId \?\? undefined : undefined\}/,
  "Xodim oynasi uning muassasasini GeofencePanel'ga uzatishi kerak",
);

assert.match(
  geofencePanel,
  /<LocationPicker[\s\S]*?search=\{\{ targetHospitalId: hospitalId \}\}/,
  "GeofencePanel joy qidiruviga tanlangan muassasa ID sini uzatishi kerak",
);

console.log("Geofence hospital scope checks passed");
