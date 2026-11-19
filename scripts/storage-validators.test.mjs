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

test("API workbench history validator accepts sanitized requests and rejects malformed entries", () => {
  const request = {
    id: "req-1",
    name: "GET https://api.example.com/users",
    method: "GET",
    url: "https://api.example.com/users",
    headers: [{ id: "h-1", key: "Accept", value: "application/json" }],
    body: "",
    savedAt: "2026-11-15T00:00:00.000Z",
  };
  assert.equal(validators.isApiWorkbenchStorageValue([request]), true);
  assert.equal(validators.isApiWorkbenchStorageValue({ version: 1, data: [request] }), true);
  assert.equal(validators.isApiWorkbenchStorageValue([{ ...request, method: "CONNECT" }]), false);
  assert.equal(validators.isApiWorkbenchStorageValue([{ ...request, headers: "broken" }]), false);
  assert.equal(validators.isApiWorkbenchStorageValue(Array(51).fill(request)), false);
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

test("TMS validators accept local project data and reject broken references", () => {
  const project = {
    version: 1, projectId: "p1", cases: [], suites: [], plans: [], runs: [], defects: [], requirements: [],
  };
  assert.equal(validators.isTestManagementStorageValue([project]), true);
  assert.equal(validators.isTestManagementStorageValue([{ ...project, suites: [{ id: "s1", projectId: "p1", name: "Suite", caseIds: ["missing"], createdAt: "now" }] }]), false);
});

test("TMS full-backup attachment validator checks payload shape and size limits", () => {
  const attachment = {
    id: "file-1", projectId: "p1", ownerType: "case", ownerId: "case-1",
    name: "evidence.png", mimeType: "image/png", size: 3, createdAt: "now", data: "AQID",
  };
  assert.equal(validators.isTmsAttachmentsBackupValue([attachment]), true);
  assert.equal(validators.isTmsAttachmentsBackupValue([{ ...attachment, size: 30 * 1024 * 1024 }]), false);
  assert.equal(validators.isTmsAttachmentsBackupValue([{ ...attachment, data: "%%%bad%%%" }]), false);
});
