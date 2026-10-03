#!/usr/bin/env node

const assert = require("node:assert/strict");
const {
  compareLintCounts,
  countLintMessages,
} = require("./check-eslint-baseline.cjs");

assert.deepEqual(
  countLintMessages([
    { errorCount: 2, warningCount: 1 },
    { errorCount: 3, warningCount: 4 },
  ]),
  { errors: 5, warnings: 5 },
);

assert.equal(
  compareLintCounts(
    { errors: 320, warnings: 10 },
    { errors: 320, warnings: 10 },
  ).ok,
  true,
  "joriy baseline o'tishi kerak",
);
assert.equal(
  compareLintCounts(
    { errors: 319, warnings: 8 },
    { errors: 320, warnings: 10 },
  ).ok,
  true,
  "lint qarzi kamayganda CI o'tishi kerak",
);
assert.equal(
  compareLintCounts(
    { errors: 321, warnings: 10 },
    { errors: 320, warnings: 10 },
  ).ok,
  false,
  "yangi error CI'ni yiqitishi kerak",
);
assert.equal(
  compareLintCounts(
    { errors: 320, warnings: 11 },
    { errors: 320, warnings: 10 },
  ).ok,
  false,
  "yangi warning CI'ni yiqitishi kerak",
);

console.log("PASS: ESLint baseline nazorati yangi lint qarzini bloklaydi");
