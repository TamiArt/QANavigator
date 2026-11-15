import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";

async function loadModule(path) {
  const source = await readFile(join(process.cwd(), path), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports });
  vm.runInContext(compiled, context);
  return module.exports;
}

const navigation = await loadModule("src/app/domain/navigation.ts");

test("navigation contract contains every application module exactly once", () => {
  const ids = navigation.APP_NAVIGATION_IDS;
  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(JSON.parse(JSON.stringify(ids)), [
    "workspace",
    "beginner-wizard",
    "requirements",
    "test-design",
    "test-execution",
    "automation",
    "release-report",
    "test-data",
    "database-workbench",
    "handbook",
    "documentation",
    "settings",
  ]);
});

test("navigation contract has non-empty labels", () => {
  assert.equal(
    navigation.APP_NAVIGATION.every((item) => item.id && item.label.trim().length > 0),
    true,
  );
});

test("sidebar exposes the requested product areas and routes existing modules into them", () => {
  const sections = navigation.APP_NAVIGATION_SECTIONS;
  const labels = sections.map((section) => section.label);
  assert.deepEqual(JSON.parse(JSON.stringify(labels)), [
    "УПРАВЛЕНИЕ ТЕСТИРОВАНИЕМ",
    "API TESTING",
    "DATABASE & SQL",
    "BACKEND & LOGS",
    "ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ",
    "ИНТЕГРАЦИИ",
    "НАСТРОЙКИ",
  ]);
  assert.ok(sections.find((section) => section.label === "DATABASE & SQL").itemIds.includes("database-workbench"));
  assert.equal(sections.find((section) => section.label === "ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ").directItemId, "test-data");
  assert.equal(sections.find((section) => section.label === "НАСТРОЙКИ").directItemId, "settings");
  assert.equal(navigation.APP_NAVIGATION.find((item) => item.id === "documentation").label, "Тестовая документация");
});
