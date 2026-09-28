import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import vm from "node:vm";

async function loadStorageModule() {
  const source = await readFile(join(process.cwd(), "src/app/core/storage.ts"), "utf8");
  const js = source
    .replace(/export const STORAGE_SCHEMA_VERSION =/, "const STORAGE_SCHEMA_VERSION =")
    .replace(/export function parseStoredValue/, "function parseStoredValue")
    .replace(/export function serializeStoredValue/, "function serializeStoredValue")
    + "\nmodule.exports = { STORAGE_SCHEMA_VERSION, parseStoredValue, serializeStoredValue };";
  const module = { exports: {} };
  vm.runInNewContext(js, { module });
  return module.exports;
}

const { STORAGE_SCHEMA_VERSION, parseStoredValue, serializeStoredValue } = await loadStorageModule();

test("storage schema writes versioned envelopes", () => {
  assert.deepEqual(JSON.parse(serializeStoredValue({ enabled: true })), { version: STORAGE_SCHEMA_VERSION, data: { enabled: true } });
});

test("storage schema reads versioned envelopes", () => {
  assert.deepEqual(Array.from(parseStoredValue(JSON.stringify({ version: 1, data: ["a", "b"] }), [])), ["a", "b"]);
});

test("storage schema keeps legacy raw values readable", () => {
  assert.deepEqual(Array.from(parseStoredValue(JSON.stringify(["legacy"]), [])), ["legacy"]);
});

test("storage schema falls back to initial data on invalid JSON", () => {
  assert.deepEqual(Array.from(parseStoredValue("{broken", ["initial"])), ["initial"]);
});