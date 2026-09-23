#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const helperPath = path.join(root, "lib", "mobile-geolocation.ts");

function loadTypeScriptModule(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Mobile geolocation helper topilmadi: ${filePath}`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  }).outputText;

  const loaded = new Module(filePath, module);
  loaded.filename = filePath;
  loaded.paths = Module._nodeModulePaths(path.dirname(filePath));
  loaded._compile(output, filePath);
  return loaded.exports;
}

function position(accuracy, latitude = 40.7821, longitude = 72.3442) {
  return {
    coords: { accuracy, latitude, longitude },
    timestamp: Date.now(),
  };
}

function permissionError(code, message) {
  return { code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
}

async function run() {
  const {
    createAccurateLocationRequest,
    detectLocationPlatform,
    getLocationIssueContent,
  } = loadTypeScriptModule(helperPath);

  {
    const calls = [];
    let currentSuccess;
    let watchSuccess;
    let clearedWatchId = null;
    const received = [];

    const geolocation = {
      getCurrentPosition(success) {
        calls.push("current");
        currentSuccess = success;
      },
      watchPosition(success) {
        calls.push("watch");
        watchSuccess = success;
        return 41;
      },
      clearWatch(id) {
        clearedWatchId = id;
      },
    };

    const request = createAccurateLocationRequest({
      geolocation,
      onPosition: (point) => received.push(point),
      onIssue: (issue) => assert.fail(`Kutilmagan GPS xatosi: ${issue}`),
      targetAccuracyM: 25,
      maxWaitMs: 25_000,
      setTimer: () => 99,
      clearTimer: () => {},
    });

    assert.deepEqual(calls, ["current"], "ruxsat avval getCurrentPosition orqali so'ralishi kerak");
    currentSuccess(position(120));
    assert.deepEqual(calls, ["current", "watch"], "qo'pol nuqtadan keyin watchPosition aniqlikni oshirishi kerak");
    watchSuccess(position(18));
    assert.deepEqual(received.map((item) => item.accuracy), [120, 18]);
    assert.equal(clearedWatchId, 41, "maqsad aniqlikka yetganda kuzatuv to'xtashi kerak");
    request.stop();
  }

  {
    let watchCalled = false;
    let issueReceived = null;
    let currentError;
    const geolocation = {
      getCurrentPosition(_success, error) {
        currentError = error;
      },
      watchPosition() {
        watchCalled = true;
        return 1;
      },
      clearWatch() {},
    };

    createAccurateLocationRequest({
      geolocation,
      onPosition: () => assert.fail("Ruxsat rad etilganda koordinata kelmasligi kerak"),
      onIssue: (issue) => { issueReceived = issue; },
      setTimer: () => 1,
      clearTimer: () => {},
    });

    currentError(permissionError(1, "User denied Geolocation"));
    assert.equal(issueReceived, "permission-denied");
    assert.equal(watchCalled, false, "ruxsat rad etilganda watchPosition qayta prompt qilmasligi kerak");
  }

  {
    let currentError;
    let watchError;
    let issueReceived = null;
    const geolocation = {
      getCurrentPosition(_success, error) {
        currentError = error;
      },
      watchPosition(_success, error) {
        watchError = error;
        return 7;
      },
      clearWatch() {},
    };

    createAccurateLocationRequest({
      geolocation,
      onPosition: () => {},
      onIssue: (issue) => { issueReceived = issue; },
      setTimer: () => 1,
      clearTimer: () => {},
    });

    currentError(permissionError(2, "Position unavailable"));
    assert.equal(typeof watchError, "function", "bir martalik GPS tayyor bo'lmasa high-accuracy watch sinab ko'rilishi kerak");
    watchError(permissionError(2, "Position unavailable"));
    assert.equal(issueReceived, "position-unavailable");
  }

  {
    let currentError;
    let timerCallback;
    let issueReceived = null;
    const geolocation = {
      getCurrentPosition(_success, error) {
        currentError = error;
      },
      watchPosition() {
        return 12;
      },
      clearWatch() {},
    };

    createAccurateLocationRequest({
      geolocation,
      onPosition: () => {},
      onIssue: (issue) => { issueReceived = issue; },
      setTimer: (callback) => {
        timerCallback = callback;
        return 1;
      },
      clearTimer: () => {},
    });

    currentError(permissionError(3, "Timeout"));
    timerCallback();
    assert.equal(issueReceived, "timeout");
  }

  {
    const ios = getLocationIssueContent("permission-denied", "ios-pwa");
    const android = getLocationIssueContent("permission-denied", "android-pwa");
    assert.match(ios.details.join(" "), /Privacy|Location Services|Aniq joylashuv/);
    assert.match(android.details.join(" "), /Ilovalar|Ruxsatlar|Sayt sozlamalari/);
    assert.notDeepEqual(ios.details, android.details, "iOS va Android yo'riqnomalari alohida bo'lishi kerak");
    assert.equal(detectLocationPlatform("Mozilla/5.0 (iPhone)", true), "ios-pwa");
    assert.equal(detectLocationPlatform("Mozilla/5.0 (Linux; Android 15)", false), "android-browser");
  }

  const pageSource = fs.readFileSync(path.join(root, "app", "dashboard", "my-checkin", "page.tsx"), "utf8");
  assert.match(
    pageSource,
    /createAccurateLocationRequest/,
    "check-in sahifasi sinovdan o'tgan mobil geolocation oqimidan foydalanishi kerak",
  );

  console.log("mobile geolocation tests: OK");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
