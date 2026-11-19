import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const source = fs.readFileSync(path.resolve("src/app/features/test-management/tms-storage.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function createHarness(initial = null) {
  const values = new Map(initial ? [["qa_navigator_test_management_v1", initial]] : []);
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const validator = (value) => {
    const data = value && typeof value === "object" && "version" in value && "data" in value
      ? value.data : value;
    return Array.isArray(data) && data.every((item) =>
      item && typeof item.projectId === "string" && item.version === 1);
  };
  const storage = {
    parseStoredValue(raw, initialValue, validate) {
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw);
      const value = parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed
        ? parsed.data : parsed;
      return !validate || validate(value) ? value : initialValue;
    },
    serializeStoredValue(value) { return JSON.stringify({ version: 1, data: value }); },
  };
  const constants = { STORAGE_KEYS: { testManagement: "qa_navigator_test_management_v1" } };
  const modules = {
    "../../core/storage": storage,
    "../../core/constants": constants,
    "../../core/storage-validators": { isTestManagementStorageValue: validator },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, localStorage,
    require(id) {
      if (!(id in modules)) throw new Error("Unexpected module: " + id);
      return modules[id];
    },
    indexedDB: undefined,
    Date,
    Promise,
    Error,
  });
  return { api: module.exports, values };
}

test("legacy localStorage project data remains readable", async () => {
  const project = { version: 1, projectId: "p1", cases: [] };
  const harness = createHarness(JSON.stringify([project]));
  const loaded = await harness.api.loadTmsProjects("localStorage");
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].projectId, "p1");
});

test("corrupt legacy JSON blocks migration instead of silently becoming an empty project list", async () => {
  const harness = createHarness("{broken-json");
  await assert.rejects(
    harness.api.loadTmsProjects("localStorage"),
    /повреждены/,
  );
  assert.equal(harness.values.get("qa_navigator_test_management_v1"), "{broken-json");
});

test("invalid legacy project structures are preserved and rejected", async () => {
  const raw = JSON.stringify([{ projectId: 12, version: 1 }]);
  const harness = createHarness(raw);
  await assert.rejects(harness.api.loadTmsProjects("localStorage"), /не прошли проверку/);
  assert.equal(harness.values.get("qa_navigator_test_management_v1"), raw);
});

test("localStorage persistence validates data before writing", async () => {
  const harness = createHarness(JSON.stringify([{ version: 1, projectId: "existing" }]));
  await harness.api.persistTmsProjects("localStorage", [{ version: 1, projectId: "next" }]);
  const saved = JSON.parse(harness.values.get("qa_navigator_test_management_v1"));
  assert.equal(saved.data[0].projectId, "next");

  const previous = harness.values.get("qa_navigator_test_management_v1");
  await assert.rejects(
    harness.api.persistTmsProjects("localStorage", [{ version: 1, projectId: 4 }]),
    /не прошли проверку/,
  );
  assert.equal(harness.values.get("qa_navigator_test_management_v1"), previous);
});

test("switching to localStorage does not change the active mode when validation fails", async () => {
  const harness = createHarness();
  await assert.rejects(
    harness.api.switchTmsStorageMode("localStorage", [{ version: 1, projectId: "" }]),
    /не прошли проверку/,
  );
  assert.equal(harness.values.has("qa_navigator_tms_storage_mode_v1"), false);
});
