import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function loadModel(relativePath) {
  const sourcePath = path.resolve(relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, console });
  return module.exports;
}

const { BACKUP_SCHEMA_VERSION, createDataBackup, parseDataBackup } = loadModel(
  "src/app/features/settings/data-backup.ts",
);

const allowedKeys = ["qa_navigator_testcases", "qa_navigator_bookmarks"];

test("backup model creates the current versioned envelope", () => {
  const backup = createDataBackup({ qa_navigator_testcases: [{ id: "TC-1" }] }, "2026-09-28T12:00:00.000Z");

  assert.equal(backup.version, BACKUP_SCHEMA_VERSION);
  assert.equal(backup.timestamp, "2026-09-28T12:00:00.000Z");
  assert.deepEqual(backup.data.qa_navigator_testcases, [{ id: "TC-1" }]);
});

test("backup parser keeps only supported storage keys", () => {
  const raw = JSON.stringify(createDataBackup({
    qa_navigator_testcases: [{ id: "TC-1" }],
    qa_navigator_bookmarks: ["topic-1"],
    unknown_key: "must be ignored",
  }, "2026-09-28T12:00:00.000Z"));

  const parsed = parseDataBackup(raw, allowedKeys);

  assert.deepEqual(parsed.data, {
    qa_navigator_testcases: [{ id: "TC-1" }],
    qa_navigator_bookmarks: ["topic-1"],
  });
  assert.equal("unknown_key" in parsed.data, false);
});

test("backup parser rejects unsupported versions", () => {
  const raw = JSON.stringify({
    timestamp: "2026-09-28T12:00:00.000Z",
    version: BACKUP_SCHEMA_VERSION + 1,
    data: {},
  });

  assert.throws(() => parseDataBackup(raw, allowedKeys), /Неподдерживаемая версия/);
});

test("backup parser rejects malformed backup structure", () => {
  assert.throws(() => parseDataBackup(JSON.stringify({ version: BACKUP_SCHEMA_VERSION, data: {} }), allowedKeys), /Некорректная дата/);
  assert.throws(() => parseDataBackup(JSON.stringify({ version: BACKUP_SCHEMA_VERSION, timestamp: "now", data: [] }), allowedKeys), /Некорректная структура/);
  assert.throws(() => parseDataBackup("not-json", allowedKeys));
});
