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
  assert.equal(ids.length, 11);
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
