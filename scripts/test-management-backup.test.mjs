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
