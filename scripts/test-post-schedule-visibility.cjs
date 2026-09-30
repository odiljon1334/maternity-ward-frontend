const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../lib/post-schedule-view.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(output, sourcePath);

const { filterAndOrderPostEmployees } = loaded.exports;
const employees = [
  { id: "empty-a", fullName: "A xodim" },
  { id: "planned-z", fullName: "Z xodim" },
  { id: "empty-b", fullName: "B xodim" },
  { id: "outside", fullName: "Tashqi xodim" },
];
const planned = new Set(["planned-z", "outside"]);
const outside = new Set(["outside"]);

assert.deepEqual(
  filterAndOrderPostEmployees(employees, planned, outside, "ALL").map((item) => item.id),
  ["planned-z", "outside", "empty-a", "empty-b"],
  "Grafik berilgan xodimlar bo‘sh qatorlardan oldin ko‘rinishi kerak",
);
assert.deepEqual(
  filterAndOrderPostEmployees(employees, planned, outside, "PLANNED").map((item) => item.id),
  ["planned-z", "outside"],
);
assert.deepEqual(
  filterAndOrderPostEmployees(employees, planned, outside, "OUTSIDE").map((item) => item.id),
  ["outside"],
);

console.log("post schedule visibility: OK");
