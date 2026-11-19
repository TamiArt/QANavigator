import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(path.resolve("src/app/features/test-management/tms-reports.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports });
const { getTmsOverviewMetrics, createTmsTraceabilityCsv, createTmsRunCsv } = module.exports;

const data = {
  version: 1,
  cases: [
    { id: "c1", key: "QA-001", title: 'Login, "valid"', priority: "P1", requirementIds: ["r1"], archived: false, automationStatus: "automated" },
    { id: "c2", key: "QA-002", title: "Search", priority: "P2", requirementIds: [], archived: true, automationStatus: "automated" },
  ],
  suites: [], plans: [], defects: [{ status: "open" }, { status: "closed" }],
  requirements: [{ id: "r1", key: "REQ-001", title: "Auth", status: "approved", priority: "P1" }, { id: "r2", key: "REQ-002", title: "Export", status: "draft", priority: "P2" }],
  runs: [{
    id: "run1", projectId: "p1", planId: "plan1", name: "Run", startedAt: "now",
    planSnapshot: { environment: "Staging", milestoneName: "Release 2.4", release: "2.4", build: "build-42" },
    caseSnapshots: { c1: { key: "QA-001", title: "Login", version: 2, steps: [{ action: "Open", expected: "Form" }] } },
    results: { c1: { status: "passed", actual: "OK", assignee: "QA Tester", stepResults: [{ status: "passed", actual: "Form visible" }] }, c2: { status: "failed", actual: "Broken" }, c3: { status: "in_progress", actual: "" }, c4: { status: "retest", actual: "Needs another run" } },
  }],
};

test("TMS overview metrics calculate latest-run pass rate and requirement coverage", () => {
  const metrics = getTmsOverviewMetrics(data);
  assert.equal(metrics.totalCases, 2);
  assert.equal(metrics.activeCases, 1);
  assert.equal(metrics.coveredRequirements, 1);
  assert.equal(metrics.coveragePercent, 50);
  assert.equal(metrics.automationCoveragePercent, 100);
  assert.equal(metrics.passRate, 50);
  assert.equal(metrics.inProgress, 1);
  assert.equal(metrics.retest, 1);
  assert.equal(metrics.openDefects, 1);
});

test("traceability CSV includes uncovered requirements and escapes cell values", () => {
  const csv = createTmsTraceabilityCsv(data);
  assert.match(csv, /NOT COVERED/);
  assert.match(csv, /""valid""/);
  assert.match(csv, /REQ-002/);
});

test("run CSV includes immutable case version and step evidence", () => {
  const csv = createTmsRunCsv(data.runs[0]);
  assert.match(csv, /QA-001/);
  assert.match(csv, /,2,/);
  assert.match(csv, /Form visible/);
  assert.match(csv, /QA Tester/);
  assert.match(csv, /Release 2.4/);
});
