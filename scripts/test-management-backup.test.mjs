import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(path.resolve("src/app/features/test-management/project-backup.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, console });
const { createTmsProjectBackup, parseTmsProjectBackup, parseTmsProjectArchive } = module.exports;

const emptyData = {
  version: 1,
  projectId: "source-project",
  cases: [],
  suites: [],
  plans: [],
  runs: [],
  defects: [],
};

test("project archive round-trips and binds imported data to the selected project", () => {
  const backup = createTmsProjectBackup(
    { id: "source-project", name: "Source" },
    emptyData,
    "2026-11-19T10:00:00.000Z",
  );
  const restored = parseTmsProjectBackup(JSON.stringify(backup), "target-project");
  assert.equal(restored.projectId, "target-project");
  assert.deepEqual(JSON.parse(JSON.stringify(restored.cases)), []);
});

test("project archive preserves valid records and remaps project ownership", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "source-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [{ action: "Open", expected: "Page opens" }],
      expected: "Success", priority: "P1", type: "Functional", tags: [],
      requirementIds: [], createdAt: "now", updatedAt: "now", archived: false,
    }],
  };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  const restored = parseTmsProjectBackup(JSON.stringify(archive), "target-project");
  assert.equal(restored.cases[0].projectId, "target-project");
  assert.equal(restored.cases[0].title, "Login");
});

test("project archive rejects malformed and unsupported files", () => {
  assert.throws(() => parseTmsProjectBackup("not-json", "target"), /корректным JSON/);
  assert.throws(() => parseTmsProjectBackup(JSON.stringify({ schemaVersion: 2 }), "target"), /корректным архивом/);
  assert.throws(() => parseTmsProjectBackup(JSON.stringify({
    schemaVersion: 1, exportedAt: "now",
    sourceProject: { id: "source", name: "Source" },
    testManagement: { ...emptyData, cases: [{ id: "broken" }] },
  }), "target"), /корректным архивом/);
});

test("project archive rejects broken links between TMS entities", () => {
  const data = { ...emptyData, suites: [{
    id: "suite-1", projectId: "source-project", name: "Suite",
    caseIds: ["missing-case"], createdAt: "now",
  }] };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  assert.throws(() => parseTmsProjectBackup(JSON.stringify(archive), "target"), /нарушенные связи/);
});

test("project archive imports the original first-slice export format", () => {
  const legacy = {
    schemaVersion: 1,
    exportedAt: "now",
    project: { id: "source-project", name: "Source" },
    testManagement: emptyData,
  };
  const restored = parseTmsProjectBackup(JSON.stringify(legacy), "target-project");
  assert.equal(restored.projectId, "target-project");
});

test("project archive exports and restores attached evidence with remapped project ownership", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "source-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [{ action: "Open", expected: "Page opens" }],
      expected: "Success", priority: "P1", type: "Functional", tags: [],
      requirementIds: [], createdAt: "now", updatedAt: "now", archived: false,
      attachmentIds: ["file-1"],
    }],
  };
  const attachments = [{
    id: "file-1", projectId: "source-project", ownerType: "case",
    ownerId: "case-1", name: "evidence.png", mimeType: "image/png",
    size: 3, createdAt: "now", data: "AQID",
  }];
  const archive = createTmsProjectBackup(
    { id: "source-project", name: "Source" }, data, "now", attachments,
  );
  const restored = parseTmsProjectArchive(JSON.stringify(archive), "target-project");
  assert.equal(restored.testManagement.cases[0].attachmentIds[0], "file-1");
  assert.equal(restored.attachments[0].projectId, "target-project");
  assert.equal(restored.attachments[0].data, "AQID");
});

test("project archive rejects missing and malformed evidence attachments", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "source-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [{ action: "Open", expected: "Page opens" }],
      expected: "Success", priority: "P1", type: "Functional", tags: [],
      requirementIds: [], createdAt: "now", updatedAt: "now", archived: false,
      attachmentIds: ["missing-file"],
    }],
  };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  assert.throws(() => parseTmsProjectArchive(JSON.stringify(archive), "target"), /отсутствует файл/);
  const malformed = {
    ...archive,
    attachments: [{
      id: "missing-file", projectId: "source-project", ownerType: "case",
      ownerId: "case-1", name: "bad.bin", mimeType: "application/octet-stream",
      size: 3, createdAt: "now", data: "%%%not-base64%%%",
    }],
  };
  assert.throws(() => parseTmsProjectArchive(JSON.stringify(malformed), "target"), /некорректные вложения/);
});

test("project archives preserve shared-step libraries and case links", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "source-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [], expected: "Success", priority: "P1",
      type: "Functional", tags: [], requirementIds: [], sharedStepIds: ["shared-1"],
      createdAt: "now", updatedAt: "now", archived: false,
    }],
    sharedSteps: [{
      id: "shared-1", projectId: "source-project", key: "SS-001", name: "Sign in",
      steps: [{ action: "Enter password", expected: "Accepted" }], version: 1,
      createdAt: "now", updatedAt: "now",
    }],
  };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  const restored = parseTmsProjectBackup(JSON.stringify(archive), "target-project");
  assert.equal(restored.sharedSteps[0].key, "SS-001");
  assert.deepEqual(Array.from(restored.cases[0].sharedStepIds), ["shared-1"]);
});


test("project archives preserve plan snapshots and expanded execution statuses", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "source-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [{ action: "Open", expected: "Form" }],
      expected: "Success", priority: "P1", type: "Functional", tags: [],
      requirementIds: [], createdAt: "now", updatedAt: "now", archived: false,
    }],
    plans: [{
      id: "plan-1", projectId: "source-project", name: "Release regression",
      environment: "Staging", suiteIds: [], caseIds: ["case-1"], createdAt: "now",
      release: "2.4", build: "build-42",
    }],
    runs: [{
      id: "run-1", projectId: "source-project", planId: "plan-1",
      name: "Regression run", startedAt: "now",
      planSnapshot: { id: "plan-1", name: "Release regression", environment: "Staging", release: "2.4", build: "build-42" },
      caseSnapshots: { "case-1": { id: "case-1", key: "QA-001", title: "Login", steps: [{ action: "Open", expected: "Form" }] } },
      results: { "case-1": {
        status: "retest", actual: "Needs another pass", comment: "",
        stepResults: [{ status: "in_progress", actual: "Form loading", comment: "" }],
      } },
    }],
  };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  const restored = parseTmsProjectBackup(JSON.stringify(archive), "target-project");
  assert.equal(restored.runs[0].planSnapshot.environment, "Staging");
  assert.equal(restored.runs[0].results["case-1"].status, "retest");
  assert.equal(restored.runs[0].results["case-1"].stepResults[0].status, "in_progress");
});


test("project archive rejects entities owned by a different source project", () => {
  const data = {
    ...emptyData,
    cases: [{
      id: "case-1", projectId: "unexpected-project", key: "QA-001", title: "Login",
      folder: "Auth", preconditions: "", steps: [], expected: "Success",
      priority: "P1", type: "Functional", tags: [], requirementIds: [],
      createdAt: "now", updatedAt: "now", archived: false,
    }],
  };
  const archive = createTmsProjectBackup({ id: "source-project", name: "Source" }, data, "now");
  assert.throws(() => parseTmsProjectBackup(JSON.stringify(archive), "target-project"), /принадлежащие другому проекту/);
});
