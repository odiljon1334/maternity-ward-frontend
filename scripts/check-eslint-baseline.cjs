#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function compareLintCounts(actual, baseline) {
  const increases = [];
  if (actual.errors > baseline.errors) {
    increases.push(`errors: ${actual.errors} > ${baseline.errors}`);
  }
  if (actual.warnings > baseline.warnings) {
    increases.push(`warnings: ${actual.warnings} > ${baseline.warnings}`);
  }
  return { ok: increases.length === 0, increases };
}

function countLintMessages(results) {
  return results.reduce(
    (total, result) => ({
      errors: total.errors + Number(result.errorCount || 0),
      warnings: total.warnings + Number(result.warningCount || 0),
    }),
    { errors: 0, warnings: 0 },
  );
}

function run() {
  const root = path.resolve(__dirname, "..");
  const baseline = JSON.parse(
    fs.readFileSync(path.join(__dirname, "eslint-baseline.json"), "utf8"),
  );
  const eslintCli = path.join(root, "node_modules", "eslint", "bin", "eslint.js");
  const lint = spawnSync(
    process.execPath,
    [eslintCli, "app", "components", "lib", "--format", "json"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  );

  if (lint.error) throw lint.error;

  // Next 14 `next lint` katta JSON natijasini stderr'da 8 KiB gacha kesadi.
  // Xuddi shu Next ESLint konfiguratsiyasini to'g'ridan-to'g'ri ishga tushirib,
  // to'liq mashina-o'qiydigan natijani stdout'dan olamiz.
  const raw = lint.stdout.trim();
  let results;
  try {
    results = JSON.parse(raw);
  } catch {
    process.stderr.write(lint.stdout || "");
    process.stderr.write(lint.stderr || "");
    throw new Error("ESLint JSON natijasini o'qib bo'lmadi");
  }

  const actual = countLintMessages(results);
  const comparison = compareLintCounts(actual, baseline);
  console.log(
    `ESLint baseline: ${actual.errors}/${baseline.errors} error, ` +
      `${actual.warnings}/${baseline.warnings} warning`,
  );

  if (!comparison.ok) {
    console.error(`Yangi lint qarzi qo'shildi: ${comparison.increases.join(", ")}`);
    process.exit(1);
  }

  if (actual.errors < baseline.errors || actual.warnings < baseline.warnings) {
    console.log(
      "Lint qarzi kamaydi. Keyingi commitda eslint-baseline.json limitlarini pasaytiring.",
    );
  }
}

if (require.main === module) run();

module.exports = { compareLintCounts, countLintMessages };
