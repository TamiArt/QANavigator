import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(path.resolve("src/app/features/test-management/tms-domain.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports });
const { reviseTmsCase, createTmsRunSnapshot, createTmsRerun } = module.exports;

const sampleCase = () => ({
  id: "case-1", projectId: "project-1", key: "QA-001", title: "Login", folder: "Auth",
  preconditions: "User exists", steps: [{ action: "Open login", expected: "Form appears" }],
  expected: "User is logged in", priority: "P1", type: "Functional", tags: ["auth"],
  requirementIds: [], createdAt: "2026-01-01", updatedAt: "2026-01-01", archived: false, version: 1,
});

test("case revisions preserve immutable previous versions", () => {
  const original = sampleCase();
  const revised = reviseTmsCase(original, { ...original, title: "Login with valid credentials" }, "2026-01-02");
  assert.equal(revised.version, 2);
  assert.equal(revised.versions.length, 1);
  assert.equal(revised.versions[0].snapshot.title, "Login");
  assert.equal(revised.title, "Login with valid credentials");
  assert.equal(original.title, "Login");
});

test("test runs capture immutable case and step snapshots", () => {
  const original = sampleCase();
  const plan = { id: "plan-1", projectId: "project-1", name: "Regression", environment: "Staging", suiteIds: [], caseIds: ["case-1"], createdAt: "now" };
  const run = createTmsRunSnapshot("run-1", "project-1", plan, [original], "2026-01-03", "Regression run");
  const revised = reviseTmsCase(original, { ...original, title: "Changed later" }, "2026-01-04");
  assert.equal(run.caseSnapshots["case-1"].title, "Login");
  assert.equal(run.caseSnapshots["case-1"].steps[0].expected, "Form appears");
  assert.equal(run.results["case-1"].stepResults.length, 1);
  assert.equal(revised.title, "Changed later");
  assert.equal(run.caseSnapshots["case-1"].title, "Login");
});

test("selective reruns include only failed and blocked cases and retain source snapshots", () => {
  const original = sampleCase();
  const plan = { id: "plan-1", projectId: "project-1", name: "Regression", environment: "Staging", suiteIds: [], caseIds: ["case-1", "case-2"], createdAt: "now" };
  const run = createTmsRunSnapshot("run-1", "project-1", plan, [original, { ...original, id: "case-2", key: "QA-002" }], "2026-01-03", "Initial");
  run.results["case-1"].status = "failed";
  run.results["case-2"].status = "passed";
  const rerun = createTmsRerun(run, "run-2", "2026-01-04", "Retest");
  assert.deepEqual(Object.keys(rerun.results), ["case-1"]);
  assert.equal(rerun.rerunOf, "run-1");
  assert.equal(rerun.caseSnapshots["case-1"].title, "Login");
  assert.equal(createTmsRerun({ ...run, results: { "case-2": run.results["case-2"] } }, "run-3", "now", "None"), null);
});
