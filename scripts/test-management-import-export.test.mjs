import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(path.resolve("src/app/features/test-management/tms-import-export.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, crypto: webcrypto, Date, JSON, Set, String, Error });
const { serializeTmsCasesCsv, parseTmsCasesCsv } = module.exports;

const sample = {
  id: "old", projectId: "p1", key: "QA-001", title: 'Login, "valid"',
  folder: "Auth", description: "Description", preconditions: "User exists",
  steps: [{ action: "Open", expected: "Form" }], expected: "Signed in",
  testData: "user@example.com", postconditions: "Session created",
  priority: "P1", type: "Functional", tags: ["auth", "smoke"],
  requirementIds: ["req-1"], references: ["JIRA-123"], estimateMinutes: 15, automationStatus: "automated", createdAt: "now", updatedAt: "now", archived: false, version: 2,
};

test("TMS CSV round-trip preserves quoted titles steps tags and requirement links", () => {
  const csv = serializeTmsCasesCsv([sample]);
  const imported = parseTmsCasesCsv(csv, "p2", [], ["req-1"]);
  assert.equal(imported[0].title, sample.title);
  assert.equal(imported[0].steps[0].expected, "Form");
  assert.deepEqual(Array.from(imported[0].tags), ["auth", "smoke"]);
  assert.deepEqual(Array.from(imported[0].requirementIds), ["req-1"]);
  assert.equal(imported[0].projectId, "p2");
  assert.deepEqual(Array.from(imported[0].references), ["JIRA-123"]);
  assert.equal(imported[0].estimateMinutes, 15);
  assert.equal(imported[0].automationStatus, "automated");
});

test("TMS CSV importer accepts common TestRail-style headers and multiline steps", () => {
  const csv = 'Title,Section,Preconditions,Steps,Expected Result,Priority,Labels\r\n"Reset password","Authentication","Known user","Open page\nSubmit email","Email sent",High,"auth;email"';
  const imported = parseTmsCasesCsv(csv, "p1", [], []);
  assert.equal(imported[0].folder, "Authentication");
  assert.equal(imported[0].priority, "P1");
  assert.equal(imported[0].steps.length, 2);
  assert.deepEqual(Array.from(imported[0].tags), ["auth", "email"]);
});

test("TMS CSV importer rejects missing title column and empty records", () => {
  assert.throws(() => parseTmsCasesCsv("Folder,Priority\nAuth,P1", "p1", [], []), /Title/);
  assert.throws(() => parseTmsCasesCsv("Title,Priority\n,P1", "p1", [], []), /нет строк/);
});
