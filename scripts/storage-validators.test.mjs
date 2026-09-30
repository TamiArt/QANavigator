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
  vm.runInNewContext(compiled, { module, exports: module.exports, console });
  return module.exports;
}

const validators = await loadModule("src/app/core/storage-validators.ts");

test("storage validators accept current versioned application values", () => {
  assert.equal(validators.isThemeStorageValue({ version: 1, data: "dark" }), true);
  assert.equal(
    validators.isApiKeysStorageValue({
      version: 1,
      data: { openrouter: "", gemini: "key", provider: "gemini" },
    }),
    true,
  );
  assert.equal(
    validators.isChecklistsStorageValue({
      version: 1,
      data: [{ id: "CL-1", text: "Login", category: "positive", status: "pending" }],
    }),
    true,
  );
  assert.equal(
    validators.isTestCasesStorageValue({
      version: 1,
      data: [{
        id: "TC-1",
        title: "Login",
        preconditions: "User exists",
        steps: ["Open page", "Submit form"],
        expected: "Dashboard opens",
        priority: "P1",
        status: "passed",
      }],
    }),
    true,
  );
  assert.equal(
    validators.isBugReportsStorageValue({
      version: 1,
      data: [{
        id: "BUG-1",
        title: "Login fails",
        environment: "Staging",
        steps: ["Open login"],
        actual: "500",
        expected: "200",
        severity: "high",
        priority: "P1",
        createdAt: "2026-09-28T00:00:00.000Z",
      }],
    }),
    true,
  );
  assert.equal(validators.isBookmarksStorageValue({ version: 1, data: ["topic-1"] }), true);
  assert.equal(validators.isTextStorageValue({ version: 1, data: "requirements" }), true);
});

test("storage validators keep legacy raw values compatible", () => {
  assert.equal(validators.isThemeStorageValue("dark"), true);
  assert.equal(validators.isBookmarksStorageValue(["topic-1", "topic-2"]), true);
  assert.equal(validators.isTextStorageValue("legacy"), true);
});

test("storage validators reject malformed structured values", () => {
  assert.equal(
    validators.isTestCasesStorageValue({
      version: 1,
      data: [{ id: "TC-1", title: "Broken", steps: "not-an-array" }],
    }),
    false,
  );
  assert.equal(
    validators.isBugReportsStorageValue({
      version: 1,
      data: [{ id: "BUG-1", severity: "unknown", priority: "P1" }],
    }),
    false,
  );
  assert.equal(
    validators.isChecklistsStorageValue({
      version: 1,
      data: [{ id: "CL-1", text: "Broken", category: "unknown", status: "pending" }],
    }),
    false,
  );
});

test("storage validators reject unsupported storage versions", () => {
  assert.equal(validators.isThemeStorageValue({ version: 2, data: "dark" }), false);
  assert.equal(validators.isBookmarksStorageValue({ version: 2, data: ["topic-1"] }), false);
  assert.equal(validators.isTextStorageValue({ version: 2, data: "future" }), false);
});
