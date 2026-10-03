const fs = require("node:fs");
const path = require("node:path");

const pagePath = path.join(
  __dirname,
  "..",
  "app",
  "dashboard",
  "settings",
  "page.tsx",
);
const source = fs.readFileSync(pagePath, "utf8");

if (source.includes(".scrollIntoView(")) {
  throw new Error(
    "Settings tab activation must not scroll the document viewport horizontally",
  );
}

if (!source.includes("container.scrollTo({")) {
  throw new Error("Settings tabs must scroll only their own overflow container");
}

if (!source.includes('className="p-4 lg:p-6 space-y-4 lg:space-y-5"')) {
  throw new Error("Settings content wrapper must keep its responsive padding");
}

console.log("PASS: settings tabs stay inside the padded content viewport");
